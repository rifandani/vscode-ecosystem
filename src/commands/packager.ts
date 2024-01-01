import vscode from 'vscode'
import type { DependencyTreeItem, NodeDependenciesProvider } from '../utils/packager'
import { views } from '../constants/config'
import { executeTerminalCommand } from '../utils/helper'

export const commandIds = {
  refreshEntry: 'veco.packager.refreshEntry',
  link: 'veco.packager.link',
  remove: 'veco.packager.remove',
  updateAll: 'veco.packager.updateAll',
  updateSingle: 'veco.packager.updateSingle',
  init: 'veco.packager.init',
} as const

/**
 * initialize `package.json` file in the root directory
 */
function initPackageJson() {
  const cmd = 'npm init --yes'
  executeTerminalCommand(cmd)
}

/**
 * init all commands and register tree data provider
 */
export function initCommands(nodeDependenciesProvider: NodeDependenciesProvider) {
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
    vscode.commands.registerCommand(
      commandIds.updateSingle,
      (dep?: DependencyTreeItem) => nodeDependenciesProvider.updateSingle(dep),
    ),
    vscode.commands.registerCommand(
      commandIds.init,
      () => initPackageJson(),
    ),
  ]
}
