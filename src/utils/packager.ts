import path from 'node:path'
import { Buffer } from 'node:buffer'
import vscode from 'vscode'
import type { PackageJson } from 'type-fest'
import semver from 'semver'
import { type PackagerDefaultConfig, configs } from '../constants/config'
import { detectPackageManager, executeCommand } from './helper'
import { getPackagerConfig } from './config'
import { jsdelivrApi } from './http'

type DepType = PackagerDefaultConfig['moduleTypes'][number]
type UpdateableDepType =
  'updatableDependencies' |
  'updatableDevDependencies' |
  'updatableOptionalDependencies' |
  'updatablePeerDependencies'
type NestedDepType =
  'nestedDependencies' |
  'nestedDevDependencies' |
  'nestedOptionalDependencies' |
  'nestedPeerDependencies'
type ContextValue =
  DepType |
  UpdateableDepType |
  NestedDepType

interface JsdelivrResolvedDep {
  type: string
  name: string
  version: string
  links: {
    self: string
    entrypoints: string
    stats: string
  }
}

const updateableContextValues: UpdateableDepType[] = ['updatableDependencies', 'updatableDevDependencies', 'updatableOptionalDependencies', 'updatablePeerDependencies']

/**
 * handle vscode `onDidChangeConfiguration` for packager config
 */
export function handleChangeConfiguration(event: vscode.ConfigurationChangeEvent, nodeDependenciesProvider: NodeDependenciesProvider) {
  // do not bother to refresh the deps list, if the packager config does not changed
  if (event.affectsConfiguration(configs.packager.root))
    nodeDependenciesProvider.refresh()
}

/**
 * update the `package.json` dependencies and execute install command
 */
async function updatePackageJsonDepsAndRunInstall(packageJsonUri: vscode.Uri, packageJsonContent: PackageJson) {
  const contentBuffer = Buffer.from(JSON.stringify(packageJsonContent, null, 2))
  // Write the updated content back to package.json
  await vscode.workspace.fs.writeFile(packageJsonUri, contentBuffer)

  // detect user package manager
  const packageManager = await detectPackageManager()
  const cmd = `${packageManager} install`
  // run install
  executeCommand(cmd)
}

/**
 * A tree item is an UI element of the tree.
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

export class NodeDependenciesProvider implements vscode.TreeDataProvider<DependencyTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DependencyTreeItem | undefined | null | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private workspaceRoot = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri
    : undefined

  getTreeItem(element: DependencyTreeItem) {
    return element
  }

  async getChildren(element?: DependencyTreeItem) {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace')
      return Promise.resolve([])
    }

    // this is when we are clicking on the dep item
    if (element)
      return Promise.resolve(await this.getNestedView(element))

    // this is when we are on the root view
    return Promise.resolve(await this.getRootView())
  }

  /**
   * should be called when there are no `element` or we are on the root view
   * we do need to check outdated deps here
   */
  private async getRootView() {
    // get the root workspace package.json
    const packageJsonUri = vscode.Uri.joinPath(this.workspaceRoot!, 'package.json')
    const packageJsonStat = await this.checkFileExists(packageJsonUri)

    if (!packageJsonStat) {
      vscode.window.showInformationMessage('Workspace has no "package.json" file')
      return []
    }

    // get original deps versions, updated deps versions, and root module deps
    const packageJsonContent = await this.getPackageJsonContent(packageJsonUri)
    const updatedDeps = await this.getUpdatedDeps(packageJsonContent)
    const deps = await this.getModuleDependencyTreesBasedOnConfig(packageJsonContent, updatedDeps) // pass in `updatedDeps`

    return deps
  }

  /**
   * should be called when there are `element` or we are clicking on the dep item
   * we do NOT need to check outdated deps here
   */
  private async getNestedView(element: DependencyTreeItem) {
    // get package.json paths, content, and finally nested module deps
    const nodeModulePackageJsonPath = vscode.Uri.joinPath(this.workspaceRoot!, 'node_modules', element.label as string, 'package.json')
    const packageJsonContent = await this.getPackageJsonContent(nodeModulePackageJsonPath)
    const deps = await this.getModuleDependencyTreesBasedOnConfig(packageJsonContent) // without passing `updatedDeps`

    return deps
  }

  /**
   * given the `packageJsonContent`, get all updateable dependencies while also respecting the user config
   */
  private async getUpdatedDeps(packageJsonContent: PackageJson) {
    const { moduleTypes, versionTarget } = getPackagerConfig()
    let affectedDeps: PackageJson['dependencies'] = {}
    const updatedDeps: PackageJson['dependencies'] = {}
    const promises = []

    // for every "prod" / "dev" / "peer" / "optional" dependencies
    for (const type of moduleTypes) {
      const depObject = packageJsonContent[type]

      // if deps not found, continue
      if (!depObject)
        continue

      // update `affectedDeps`
      affectedDeps = {
        ...affectedDeps,
        ...depObject,
      }

      const _promises = Object.entries(depObject).map(([name, version]) => {
        // `version` still includes caret (^), tilde (~), etc...
        const specifier = versionTarget === 'semver' ? version : versionTarget
        return jsdelivrApi.get(`packages/npm/${name}/resolved/?specifier=${specifier}`)
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
      const usedDepVersion = affectedDeps[resolvedDep.name]! // version with tilde / caret
      const prefix = this.getVersionPrefix(usedDepVersion) // like ^, ~, >, >=, etc...
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
  private async getModuleDependencyTreesBasedOnConfig(packageJsonContent: PackageJson, updatedDeps?: PackageJson['dependencies']) {
    const { moduleTypes } = getPackagerConfig()
    const depTrees: DependencyTreeItem[] = []

    // for every "prod" / "dev" / "peer" / "optional" dependencies
    for (const type of moduleTypes) {
      const deps = packageJsonContent[type]
      const contextValue = updatedDeps ? type : `nested${type.at(0)!.toUpperCase()}${type.slice(1)}` as ContextValue
      const _depTrees = await this.getModuleDependencyTrees({
        deps,
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
  private async getModuleDependencyTrees({ contextValue, deps = {}, updatedDeps = {} }: { contextValue: ContextValue, deps: PackageJson['dependencies'], updatedDeps?: PackageJson['dependencies'] }) {
    const depTrees = []

    // for each installed module
    for (const moduleName of Object.keys(deps)) {
      const version = deps[moduleName] as string
      const modulePath = vscode.Uri.joinPath(this.workspaceRoot!, 'node_modules', moduleName)
      const moduleExists = await this.checkFileExists(modulePath)
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
  private getVersionPrefix(version: string) {
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
   * given the `packageJsonUri`, read the file content and parse it
   */
  private async getPackageJsonContent(packageJsonUri: vscode.Uri) {
    const content = await vscode.workspace.fs.readFile(packageJsonUri)

    return JSON.parse(content.toString()) as PackageJson
  }

  /**
   * given the `uri`, read the file stat, if it returns `undefined` that means the file doesn't exists
   */
  private async checkFileExists(uri: vscode.Uri) {
    try {
      const stat = await vscode.workspace.fs.stat(uri)
      return stat
    }
    catch (err) {
      return undefined
    }
  }

  /**
   * notify all subscribers of the event from "onDidChangeTreeData"
   */
  public refresh() {
    this._onDidChangeTreeData.fire()
  }

  /**
   * open/link the selected dependency to the external NPM website documentation
   */
  public async link(dep?: DependencyTreeItem) {
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
  public async remove(dep?: DependencyTreeItem) {
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

    executeCommand(cmd)
    this.refresh()
  }

  /**
   * update all outdated root dependencies
   *
   * NOTE: should be displayed & clickable, if there are at least 1 updateable dependencies
   */
  public async updateAll() {
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
      const packageJsonUri = vscode.Uri.joinPath(this.workspaceRoot!, 'package.json')
      const packageJsonContent = await this.getPackageJsonContent(packageJsonUri)

      // for each `updateableRootDeps`, we update the `packageJsonContent`
      for (const dep of updateableRootDeps) {
        const updatedVersion = (dep.description as string).split('->').at(-1)
        const depTypeToUpdate = moduleTypes.find(type => packageJsonContent[type]?.[dep.label])

        if (!depTypeToUpdate) {
          vscode.window.showInformationMessage(`Module ${dep.label} doesn't exists in ${moduleTypes.map(type => `"${type}"`).join(' or ')}`)
          continue
        }

        // update the affected dep version from `packageJsonContent`
        packageJsonContent[depTypeToUpdate]![dep.label] = updatedVersion
      }

      await updatePackageJsonDepsAndRunInstall(packageJsonUri, packageJsonContent)
      this.refresh()
    })
  }

  /**
   * update single outdated root dependencies
   *
   * NOTE: should only run if the selected dependency is the root AND updateable
   */
  public async updateSingle(dep?: DependencyTreeItem) {
    if (!dep) {
      vscode.window.showInformationMessage('This command can not be invoked directly')
      return
    }

    const contextValue = dep.contextValue as ContextValue

    // make sure the dependencies is updatable
    if (!updateableContextValues.includes(contextValue as UpdateableDepType))
      return

    const { moduleTypes } = getPackagerConfig()
    const packageJsonUri = vscode.Uri.joinPath(this.workspaceRoot!, 'package.json')
    const packageJsonContent = await this.getPackageJsonContent(packageJsonUri)
    const updatedVersion = (dep.description as string).split('->').at(-1)
    const depTypeToUpdate = moduleTypes.find(type => packageJsonContent[type]?.[dep.label])

    if (!depTypeToUpdate) {
      vscode.window.showInformationMessage(`Module ${dep.label} doesn't exists in ${moduleTypes.map(type => `"${type}"`).join(' or ')}`)
      return
    }

    // update the affected dep version from `packageJsonContent`
    packageJsonContent[depTypeToUpdate]![dep.label] = updatedVersion

    await updatePackageJsonDepsAndRunInstall(packageJsonUri, packageJsonContent)
    this.refresh()
  }
}
