import fs from 'node:fs'
import path from 'node:path'
import vscode from 'vscode'
import { run } from 'npm-check-updates'
import type { PackageJson } from 'type-fest'
import { commandIds } from '../commands/packager'
import { views } from '../constants/config'
import { defaultCheckRunOptions, defaultUpdateRunOptions } from '../constants/packager'
import { detectPackageManager, executeCommand } from './helper'

type ContextValue = 'dependencies' | 'devDependencies' | 'nestedDependencies' | 'nestedDevDependencies'

/**
 * A tree item is an UI element of the tree.
 *
 * - `description` format -> `(dev) ^1.0.0` or `^1.0.0` or `^1.0.0 -> 1.1.0`
 */
class DependencyTreeItem extends vscode.TreeItem {
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

  constructor(private workspaceRoot: string | undefined) {}

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
      return this.getDependenciesView(element)

    // this is when we are on the root view
    return this.getRootView()
  }

  /**
   * should be called when there are no `element` or we are on the root view
   * we need to check for outdated dependencies using `taze`
   */
  private async getRootView() {
    // get the root workspace package.json
    const packageJsonPath = path.join(this.workspaceRoot!, 'package.json')
    const packageJsonExists = this.pathExists(packageJsonPath)

    if (!packageJsonExists) {
      vscode.window.showInformationMessage('Workspace has no package.json')
      return Promise.resolve([])
    }

    // get original deps versions, and updated deps versions
    const packageJsonContent = this.getPackageJsonContent(packageJsonPath)
    const updatedDeps = await run({
      ...defaultCheckRunOptions,
      cwd: this.workspaceRoot!,
    }, { cli: false }) as Record<string, string>

    // pass in `updatedDeps` to get informed about the outdated deps
    const deps = this.getModuleDependencyTrees({ updatedDeps, contextValue: 'dependencies', deps: packageJsonContent.dependencies })
    const devDeps = this.getModuleDependencyTrees({ updatedDeps, contextValue: 'devDependencies', deps: packageJsonContent.devDependencies })

    return Promise.resolve(deps.concat(devDeps))
  }

  /**
   * should be called when there are `element` or we are clicking on the dep item
   * we does not need to check outdated deps here
   */
  private getDependenciesView(element: DependencyTreeItem) {
    // get package.json paths
    const nodeModulePackageJsonPath = path.join(this.workspaceRoot!, 'node_modules', element.label as string, 'package.json')
    const packageJsonContent = this.getPackageJsonContent(nodeModulePackageJsonPath)

    // get nested module dependencies
    const deps = this.getModuleDependencyTrees({ contextValue: 'nestedDependencies', deps: packageJsonContent.dependencies })
    const devDeps = this.getModuleDependencyTrees({ contextValue: 'nestedDevDependencies', deps: packageJsonContent.devDependencies })

    return Promise.resolve(deps.concat(devDeps))
  }

  /**
   * given the `dependencies` object from `package.json`, then convert it into `DependencyTreeItem`
   */
  private getModuleDependencyTrees({ contextValue, deps = {}, updatedDeps = {} }: { contextValue: ContextValue, deps: PackageJson['dependencies'], updatedDeps?: PackageJson['dependencies'] }) {
    return Object.keys(deps).map((moduleName) => {
      const version = deps[moduleName] as string
      const modulePath = path.join(this.workspaceRoot!, 'node_modules', moduleName)
      const moduleExists = this.pathExists(modulePath)
      let description
        = contextValue === 'devDependencies' || contextValue === 'nestedDevDependencies'
          ? `(dev) ${version}`
          : version

      // inform updated package in description
      if (Object.hasOwn(updatedDeps, moduleName))
        description += ` -> ${updatedDeps[moduleName]}`

      return new DependencyTreeItem(
        moduleName,
        moduleExists ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        {
          contextValue,
          description,
        },
      )
    })
  }

  /**
   * given the `packageJsonPath`, read the file content and parse it
   */
  private getPackageJsonContent(packageJsonPath: string) {
    const content = fs.readFileSync(packageJsonPath, 'utf-8')

    return JSON.parse(content) as PackageJson
  }

  /**
   * synchronously tests a user's permissions for the file or directory specified by path
   */
  private pathExists(_path: string) {
    try {
      fs.accessSync(_path)
    }
    catch (err) {
      return false
    }

    return true
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

    executeCommand({ cmd })
    this.refresh()
  }

  /**
   * update all outdated root dependencies
   */
  public async updateAll() {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Updating outdated dependencies',
      cancellable: false,
    }, async (progress) => {
      progress.report({ increment: 0, message: 'Starting updates...' })

      // check outdated deps, upgrade the version in package.json, and install it
      await run({
        ...defaultUpdateRunOptions,
        cwd: this.workspaceRoot!,
      }, { cli: false }) as Record<string, string>

      // Show an information message
      vscode.window.showInformationMessage('All outdated dependencies updated!')

      // refresh deps list
      this.refresh()
    })
  }
}

/**
 * init all commands and register tree data provider
 */
export function init() {
  const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined
  const nodeDependenciesProvider = new NodeDependenciesProvider(rootPath)

  return [
    vscode.window.registerTreeDataProvider(
      views.veco_packager,
      nodeDependenciesProvider,
    ),
    vscode.commands.registerCommand(
      commandIds.refreshEntry,
      () => nodeDependenciesProvider.refresh(),
    ),
    vscode.commands.registerCommand(
      commandIds.link,
      (dep?: DependencyTreeItem) => nodeDependenciesProvider.link(dep),
    ),
    vscode.commands.registerCommand(
      commandIds.remove,
      (dep?: DependencyTreeItem) => nodeDependenciesProvider.remove(dep),
    ),
    vscode.commands.registerCommand(
      commandIds.updateAll,
      () => nodeDependenciesProvider.updateAll(),
    ),
  ]
}
