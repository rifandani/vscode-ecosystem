import path from 'node:path'
import { Buffer } from 'node:buffer'
import vscode from 'vscode'
import type { PackageJson } from 'type-fest'
import semver from 'semver'
import { omit } from '@rifandani/nxact-yutiriti'
import { minimatch } from 'minimatch'
import { configs, views } from '../constants/config'
import { checkFileExists, detectPackageManager, executeTerminalCommand, getNonce, getPaths, getUriContent, getWebviewUri } from '../utils/helper'
import { getPackagerConfig } from '../utils/config'
import { jsdelivrApi, npmRegistryApi } from '../utils/http'
import type { ContextValue, IncomingMessage, JsdelivrResolvedDep, Registry, UpdateableDepType } from '../constants/packager'
import { updateableContextValues } from '../constants/packager'

export class Packager {
  /**
   * update the `package.json` dependencies and execute install command
   */
  static async updatePackageJsonDepsAndRunInstall(packageJsonUri: vscode.Uri, packageJsonContent: PackageJson) {
    const contentBuffer = Buffer.from(JSON.stringify(packageJsonContent, null, 2))
    // Write the updated content back to package.json
    await vscode.workspace.fs.writeFile(packageJsonUri, contentBuffer)

    // detect user package manager
    const packageManager = await detectPackageManager()
    const cmd = `${packageManager} install`
    // run install
    executeTerminalCommand(cmd)
  }

  /**
   * handle vscode `onDidChangeConfiguration` for packager config
   */
  static handleChangeConfiguration(event: vscode.ConfigurationChangeEvent, nodeDependenciesProvider: NodeDependenciesProvider) {
    // do not bother to refresh the deps list, if the packager config does not changed
    if (event.affectsConfiguration(configs.packager.root))
      nodeDependenciesProvider.refreshCommand()
  }
}

/**
 * Node Dependencies tree item is an UI element of the tree.
 *
 * - `description` format -> `(dev) ^1.0.0` or `^1.0.0` or `^1.0.0 -> 1.1.0`
 */
export class DependencyTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly options?: {
      readonly contextValue?: ContextValue
      readonly description?: string
    },
  ) {
    super(label, collapsibleState)

    this.contextValue = options?.contextValue
    this.description = options?.description
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'res', 'light', 'type-hierarchy-sub.svg'),
      dark: path.join(__filename, '..', '..', 'res', 'dark', 'type-hierarchy-sub.svg'),
    }
  }
}

/**
 * Node Dependencies tree data provider
 */
export class NodeDependenciesProvider implements vscode.TreeDataProvider<DependencyTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DependencyTreeItem | undefined | null | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _workspaceRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri
    : undefined

  getTreeItem(element: DependencyTreeItem) {
    return element
  }

  async getChildren(element?: DependencyTreeItem) {
    if (!this._workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace')
      return Promise.resolve([])
    }

    // this is when we are clicking on the dep item
    if (element)
      return Promise.resolve(await this._getNestedView(element))

    // this is when we are on the root view
    return Promise.resolve(await this._getRootView())
  }

  /**
   * should be called when there are no `element` or we are on the root view
   * we do need to check outdated deps here
   */
  private async _getRootView() {
    // get the root workspace package.json
    const packageJsonUri = vscode.Uri.joinPath(this._workspaceRoot!, 'package.json')
    const packageJsonStat = await checkFileExists(packageJsonUri)

    if (!packageJsonStat) {
      vscode.window.showInformationMessage('There is no "package.json" file in the workspace')
      return []
    }

    // get original deps versions, updated deps versions, and root module deps
    const packageJsonContent = await getUriContent<PackageJson>(packageJsonUri)
    const updatedDeps = await this._getUpdatedDeps(packageJsonContent)
    const deps = await this._getModuleDependencyTreesBasedOnConfig(packageJsonContent, updatedDeps) // pass in `updatedDeps`

    return deps
  }

  /**
   * should be called when there are `element` or we are clicking on the dep item
   * we do NOT need to check outdated deps here
   */
  private async _getNestedView(element: DependencyTreeItem) {
    // get package.json paths, content, and finally nested module deps
    const nodeModulePackageJsonPath = vscode.Uri.joinPath(this._workspaceRoot!, 'node_modules', element.label as string, 'package.json')
    const packageJsonContent = await getUriContent<PackageJson>(nodeModulePackageJsonPath)
    const deps = await this._getModuleDependencyTreesBasedOnConfig(packageJsonContent) // without passing `updatedDeps`

    return deps
  }

  /**
   * given the `packageJsonContent`, get all updateable dependencies while also respecting the user config
   */
  private async _getUpdatedDeps(packageJsonContent: PackageJson) {
    const { moduleTypes, versionTarget, exclude } = getPackagerConfig()
    let affectedDeps: PackageJson['dependencies'] = {}
    const updatedDeps: PackageJson['dependencies'] = {}
    const promises = []

    // for every "prod" / "dev" / "peer" / "optional" dependencies
    for (const type of moduleTypes) {
      const depObject = packageJsonContent[type]

      // if deps not found, continue
      if (!depObject)
        continue

      // exclude depObject key that included in `exclude` array config
      const paths = getPaths(exclude)
      const excludeMatches = Object.keys(depObject).filter(pkgName => minimatch(pkgName, paths))
      const filteredDepObject = excludeMatches.length ? omit(depObject, excludeMatches) : depObject

      // update `affectedDeps`
      affectedDeps = {
        ...affectedDeps,
        ...filteredDepObject,
      }

      const _promises = Object.entries(filteredDepObject).map(([name, version]) => {
        // `version` still includes caret (^), tilde (~), etc...
        const specifier = versionTarget === 'semver' ? version : versionTarget
        return jsdelivrApi.get(`packages/npm/${name}/resolved?specifier=${specifier}`)
      })

      promises.push(..._promises)
    }

    const manifests = await Promise.allSettled(promises)

    // updates `finalUpdatedDeps` for each resolved `manifests`
    for (const manifest of manifests) {
      // do not include rejected promise
      if (manifest.status === 'rejected')
        continue

      const resolvedDep = await manifest.value.json<JsdelivrResolvedDep>() // version without tilde / caret
      const usedDepVersion = affectedDeps[resolvedDep.name]!.trim() // version with tilde / caret
      const prefix = this._getVersionPrefix(usedDepVersion) // like ^, ~, >, >=, etc...
      const parseableVer = usedDepVersion.replace(prefix, '') // version without prefix
      const parsed = semver.parse(parseableVer)

      // do not include the same version deps
      if (!parsed || parsed.version === resolvedDep.version)
        continue

      // only include when the version is newer
      updatedDeps[resolvedDep.name] = prefix + resolvedDep.version
    }

    return updatedDeps
  }

  /**
   * given the `packageJsonContent`, construct module dependency tree based on the user config properties
   *
   * if `updatedDeps` defined, then it will be root dependencies, otherwise it's nested dependencies
   */
  private async _getModuleDependencyTreesBasedOnConfig(packageJsonContent: PackageJson, updatedDeps?: PackageJson['dependencies']) {
    const { moduleTypes, exclude } = getPackagerConfig()
    const depTrees: DependencyTreeItem[] = []

    // for every "prod" / "dev" / "peer" / "optional" dependencies
    for (const type of moduleTypes) {
      // exclude depObject key that included in `exclude` array config
      const depObject = packageJsonContent[type] ?? {}
      const paths = getPaths(exclude)
      const excludeMatches = Object.keys(depObject).filter(pkgName => minimatch(pkgName, paths))
      const filteredDepObject = excludeMatches.length ? omit(depObject, excludeMatches) : depObject
      const contextValue = updatedDeps ? type : `nested${type.at(0)!.toUpperCase()}${type.slice(1)}` as ContextValue
      const _depTrees = await this._getModuleDependencyTrees({
        deps: filteredDepObject,
        contextValue,
        updatedDeps, // pass in `updatedDeps` to get informed about the outdated deps
      })

      depTrees.push(..._depTrees)
    }

    return depTrees
  }

  /**
   * given the `dependencies` object from `package.json`, then convert it into `DependencyTreeItem`
   */
  private async _getModuleDependencyTrees({ contextValue, deps = {}, updatedDeps = {} }: { contextValue: ContextValue, deps: PackageJson['dependencies'], updatedDeps?: PackageJson['dependencies'] }) {
    const depTrees = []

    // for each installed module
    for (const moduleName of Object.keys(deps)) {
      const version = (deps[moduleName] as string).trim()
      const modulePath = vscode.Uri.joinPath(this._workspaceRoot!, 'node_modules', moduleName)
      const moduleExists = await checkFileExists(modulePath)
      let description
        = contextValue === 'devDependencies' || contextValue === 'nestedDevDependencies'
          ? `(dev) ${version}`
          : contextValue === 'peerDependencies' || contextValue === 'nestedPeerDependencies'
            ? `(peer) ${version}`
            : contextValue === 'optionalDependencies' || contextValue === 'nestedOptionalDependencies'
              ? `(optional) ${version}`
              : version
      let newContextValue = contextValue

      // if current module is updatable
      if (Object.hasOwn(updatedDeps, moduleName)) {
        // inform updated package in description
        description += ` -> ${updatedDeps[moduleName]}`
        // set `newContextValue` as updatable
        newContextValue
          = contextValue === 'dependencies'
            ? 'updatableDependencies'
            : contextValue === 'devDependencies'
              ? 'updatableDevDependencies'
              : contextValue === 'peerDependencies'
                ? 'updatablePeerDependencies'
                : 'updatableOptionalDependencies'
      }

      depTrees.push(new DependencyTreeItem(
        moduleName,
        moduleExists ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        {
          description,
          contextValue: newContextValue,
        },
      ))
    }

    return depTrees
  }

  /**
   * given the `version`, get the prefix like caret (^), tilde (~), ranges (<, <=, >, >=, =)
   */
  private _getVersionPrefix(version: string) {
    let prefix = ''

    for (let index = 0; index < version.length; index++) {
      const _prefix = version.substring(index, index + 1)

      if (Number.isNaN(+_prefix)) {
        prefix += _prefix
        continue
      }

      break
    }

    return prefix
  }

  /**
   * notify all subscribers of the event from "onDidChangeTreeData"
   */
  public refreshCommand() {
    this._onDidChangeTreeData.fire()
  }

  /**
   * open/link the selected dependency to the external NPM website documentation
   */
  public async linkCommand(dep?: DependencyTreeItem) {
    if (!dep) {
      vscode.window.showInformationMessage('This command can not be invoked directly')
      return
    }

    const url = `https://www.npmjs.com/package/${dep.label}`
    const parsedUrl = vscode.Uri.parse(url)

    await vscode.env.openExternal(parsedUrl)
  }

  /**
   * uninstall/remove the selected dependency
   *
   * NOTE: should only run if the selected dependency is the root "dependencies" / "devDependencies"
   */
  public async removeCommand(dep?: DependencyTreeItem) {
    if (!dep) {
      vscode.window.showInformationMessage('This command can not be invoked directly')
      return
    }

    let cmd = ''
    const packageManager = await detectPackageManager()

    switch (packageManager) {
      case 'bun':
        cmd = `bun remove ${dep.label}`
        break
      case 'yarn':
        cmd = `yarn remove ${dep.label}`
        break
      case 'pnpm':
        cmd = `pnpm remove ${dep.label}`
        break
      default:
        cmd = `npm uninstall ${dep.label}`
        break
    }

    executeTerminalCommand(cmd)
    this.refreshCommand()
  }

  /**
   * update all outdated root dependencies
   *
   * NOTE: should be displayed & clickable, if there are at least 1 updateable dependencies
   */
  public async updateAllCommand() {
    const rootDeps = await this.getChildren()
    const updateableRootDeps = rootDeps.filter(dep => updateableContextValues.includes(dep.contextValue as UpdateableDepType))

    if (!updateableRootDeps.length) {
      vscode.window.showInformationMessage(`There is no updateable dependencies!`)
      return
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Updating outdated dependencies',
      cancellable: false,
    }, async (progress) => {
      progress.report({ increment: 10, message: `Starting updates...` })

      const { moduleTypes } = getPackagerConfig()
      const packageJsonUri = vscode.Uri.joinPath(this._workspaceRoot!, 'package.json')
      const packageJsonContent = await getUriContent<PackageJson>(packageJsonUri)

      // for each `updateableRootDeps`, we update the `packageJsonContent`
      for (const dep of updateableRootDeps) {
        const updatedVersion = (dep.description as string).split('->').at(-1)!.trim()
        const depTypeToUpdate = moduleTypes.find(type => packageJsonContent[type]?.[dep.label])

        if (!depTypeToUpdate) {
          vscode.window.showInformationMessage(`Module ${dep.label} doesn't exists in ${moduleTypes.map(type => `"${type}"`).join(' or ')}`)
          continue
        }

        // update the affected dep version from `packageJsonContent`
        packageJsonContent[depTypeToUpdate]![dep.label] = updatedVersion
      }

      await Packager.updatePackageJsonDepsAndRunInstall(packageJsonUri, packageJsonContent)
      this.refreshCommand()
    })
  }

  /**
   * update single outdated root dependencies
   *
   * NOTE: should only run if the selected dependency is the root AND updateable
   */
  public async updateSingleCommand(dep?: DependencyTreeItem) {
    if (!dep) {
      vscode.window.showInformationMessage('This command can not be invoked directly')
      return
    }

    const contextValue = dep.contextValue as ContextValue

    // make sure the dependencies is updatable
    if (!updateableContextValues.includes(contextValue as UpdateableDepType))
      return

    const { moduleTypes } = getPackagerConfig()
    const packageJsonUri = vscode.Uri.joinPath(this._workspaceRoot!, 'package.json')
    const packageJsonContent = await getUriContent<PackageJson>(packageJsonUri)
    const updatedVersion = (dep.description as string).split('->').at(-1)!.trim()
    const depTypeToUpdate = moduleTypes.find(type => packageJsonContent[type]?.[dep.label])

    if (!depTypeToUpdate) {
      vscode.window.showInformationMessage(`Module ${dep.label} doesn't exists in ${moduleTypes.map(type => `"${type}"`).join(' or ')}`)
      return
    }

    // update the affected dep version from `packageJsonContent`
    packageJsonContent[depTypeToUpdate]![dep.label] = updatedVersion

    await Packager.updatePackageJsonDepsAndRunInstall(packageJsonUri, packageJsonContent)
    this.refreshCommand()
  }
}

export class NodeDependenciesWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = views.packager.installDeps
  private _webviewView?: vscode.WebviewView

  constructor(private readonly _extensionUri: vscode.Uri) {}

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the Vue webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be rendered within the webview panel
   */
  private _getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // The assets from the Vue build output
    const stylesUri = getWebviewUri(webview, extensionUri, ['webview-ui', 'build', 'assets', 'index.css'])
    const scriptUri = getWebviewUri(webview, extensionUri, ['webview-ui', 'build', 'assets', 'index.js'])
    const nonce = getNonce()

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Packager: Install Node Dependencies</title>
        </head>
        <body>
          <div id="app"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._webviewView = webviewView

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      // localResourceRoots: [this._extensionUri],
      // Restrict the webview to only load resources from the `dist` and `webview-ui/build` directories
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist'), vscode.Uri.joinPath(this._extensionUri, 'webview-ui/build')],
    }

    webviewView.webview.html = this._getWebviewHtml(webviewView.webview, this._extensionUri)

    webviewView.webview.onDidReceiveMessage(
      async (message: IncomingMessage) => {
        switch (message.type) {
          case 'search': {
            if (!message.search) {
              await webviewView.webview.postMessage({
                type: 'ext.suggestions',
                suggestions: [],
              })
              break
            }

            const response = await npmRegistryApi.get(`search?size=50&text=${message.search}`)
            const registry = await response.json<Registry>()

            await webviewView.webview.postMessage({
              type: 'ext.suggestions',
              suggestions: registry.objects,
            })
            break
          }

          case 'link': {
            const parsedUrl = vscode.Uri.parse(message.link)
            await vscode.env.openExternal(parsedUrl)
            break
          }

          case 'install-prod': {
            // detect user package manager
            const packageManager = await detectPackageManager()
            const cmd = `${packageManager} add ${message.packageName}@latest`
            // run install
            executeTerminalCommand(cmd)
            break
          }
          case 'install-dev': {
            // detect user package manager
            const packageManager = await detectPackageManager()
            const cmd = `${packageManager} add -D ${message.packageName}@latest`
            // run install
            executeTerminalCommand(cmd)
            break
          }
        }
      },
    )
  }
}
