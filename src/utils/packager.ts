import fs from 'node:fs'
import path from 'node:path'
import vscode from 'vscode'
import type { PackageJson } from 'type-fest'
import { commandIds } from '../commands/packager'
import { views } from '../constants/config'

type ContextValue = 'dependencies' | 'devDependencies' | 'nestedDependencies'

/**
 * A tree item is an UI element of the tree.
 *
 * - `description` format -> `v1.0.0` or `v1.0.0 (dev)`
 */
class DependencyTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: ContextValue,
    public readonly description?: string,
  ) {
    super(label, collapsibleState)

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
   * should be called when there are `element` or we are clicking on the dep item
   */
  private getDependenciesView(element: DependencyTreeItem) {
    // get package.json paths
    const nodeModulePackageJsonPath = path.join(this.workspaceRoot!, 'node_modules', element.label as string, 'package.json')
    const packageJsonContent = this.getPackageJsonContent(nodeModulePackageJsonPath)

    const deps = this.getModuleDependencyTrees('dependencies', packageJsonContent.dependencies)
    const devDeps = this.getModuleDependencyTrees('devDependencies', packageJsonContent.devDependencies)

    return Promise.resolve(deps.concat(devDeps))
  }

  /**
   * should be called when there are no `element` or we are on the root view
   */
  private getRootView() {
    // get the root workspace package.json
    const packageJsonPath = path.join(this.workspaceRoot!, 'package.json')
    const packageJsonExists = this.pathExists(packageJsonPath)

    if (!packageJsonExists) {
      vscode.window.showInformationMessage('Workspace has no package.json')
      return Promise.resolve([])
    }

    // based on the package.json content, get all dependencies & devDependencies
    const treeItems = <DependencyTreeItem[]>[]
    const packageJsonContent = this.getPackageJsonContent(packageJsonPath)

    if (packageJsonContent.dependencies) {
      const deps = this.getModuleDependencyTrees('dependencies', packageJsonContent.dependencies)
      treeItems.push(...deps)
    }
    if (packageJsonContent.devDependencies) {
      const devDeps = this.getModuleDependencyTrees('devDependencies', packageJsonContent.devDependencies)
      treeItems.push(...devDeps)
    }

    return Promise.resolve(treeItems)
  }

  /**
   * given the `packageJsonPath`, read the file content and parse it
   */
  private getPackageJsonContent(packageJsonPath: string) {
    const content = fs.readFileSync(packageJsonPath, 'utf-8')

    return JSON.parse(content) as PackageJson
  }

  /**
   * given the `dependencies` object from `package.json`, then convert it into `DependencyTreeItem`
   */
  private getModuleDependencyTrees(contextValue: ContextValue, deps: PackageJson['dependencies']) {
    return deps
      ? Object.keys(deps).map((moduleName) => {
        const version = deps[moduleName] as string
        const modulePath = path.join(this.workspaceRoot!, 'node_modules', moduleName)
        const moduleExists = this.pathExists(modulePath)

        return new DependencyTreeItem(
          moduleName,
          moduleExists ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
          contextValue,
          contextValue === 'devDependencies' ? `${version} (dev)` : version,
        )
      })
      : []
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
  public refresh(): void {
    this._onDidChangeTreeData.fire()
  }
}

/**
 * init commands and register tree data provider
 */
export function init() {
  const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined
  const nodeDependenciesProvider = new NodeDependenciesProvider(rootPath)

  return [
    vscode.commands.registerCommand(
      commandIds.refreshEntry,
      () => nodeDependenciesProvider.refresh(),
    ),
    vscode.window.registerTreeDataProvider(
      views.veco_packager,
      nodeDependenciesProvider,
    ),
  ]
}
