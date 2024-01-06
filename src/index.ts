import vscode from 'vscode'
import { colorize } from './modules/colorize'
import { commandIds as colorizeCommandIds } from './constants/colorize'
import { highlight } from './modules/highlight'
import { commandIds as highlightCommandIds } from './constants/highlight'
import { fileNesting } from './modules/file-nesting'
import { commandIds as fileNestingCommandIds } from './constants/file-nesting'
import { Logger } from './modules/logger'
import { commandIds as loggerCommandIds } from './constants/logger'
import { region } from './modules/region'
import { commandIds as regionCommandIds } from './constants/region'
import { views } from './constants/config'
import { commandIds as commonCommandIds } from './constants/common'
import { executeInitPackageJson } from './utils/helper'
import { commandIds as packagerCommandIds } from './constants/packager'
import type { DependencyTreeItem } from './modules/packager'
import { NodeDependenciesProvider, NodeDependenciesWebviewViewProvider, Packager } from './modules/packager'
import { commandIds as delinerCommandIds } from './constants/deliner'
import { Deliner } from './modules/deliner'

export async function activate(context: vscode.ExtensionContext) {
  // init "highlight" internal states
  highlight.init()
  // init "packager" providers
  const nodeDependenciesProvider = new NodeDependenciesProvider()
  const nodeDependenciesWebviewViewProvider = new NodeDependenciesWebviewViewProvider(context.extensionUri)

  // trigger update "highlight" and "colorize" for the first time
  if (vscode.window.activeTextEditor) {
    highlight.triggerUpdateHighlight()
    colorize.triggerUpdateColorize()
  }

  const highlightDisposables = [
    vscode.commands.registerCommand(
      highlightCommandIds.toggleEnabled,
      () => highlight.toggleEnabledCommand(),
    ),
    vscode.commands.registerCommand(
      highlightCommandIds.listAnnotations,
      () => highlight.listAnnotationsCommand(),
    ),
    vscode.commands.registerCommand(
      highlightCommandIds.showLogOutputChannel,
      () => highlight.showLogOutputChannelCommand(),
    ),
  ]

  const fileNestingDisposables = [
    vscode.commands.registerCommand(
      fileNestingCommandIds.apply,
      () => fileNesting.applyCommand(),
    ),
    vscode.commands.registerCommand(
      fileNestingCommandIds.remove,
      () => fileNesting.removeCommand(),
    ),
  ]

  const colorizeDisposables = [
    vscode.commands.registerCommand(
      colorizeCommandIds.toggleEnabled,
      () => colorize.toggleEnabledCommand(),
    ),
  ]

  const loggerDisposables = [
    vscode.commands.registerCommand(
      loggerCommandIds.insert,
      () => Logger.insertCommand(),
    ),
    vscode.commands.registerCommand(
      loggerCommandIds.comment,
      () => Logger.commentCommand(),
    ),
    vscode.commands.registerCommand(
      loggerCommandIds.uncomment,
      () => Logger.uncommentCommand(),
    ),
    vscode.commands.registerCommand(
      loggerCommandIds.delete,
      () => Logger.deleteAllCommand(),
    ),
  ]

  const regionDisposables = [
    vscode.commands.registerCommand(
      regionCommandIds.mark,
      () => region.markCommand(),
    ),
    vscode.commands.registerCommand(
      regionCommandIds.delete,
      () => region.deleteInDocumentCommand(),
    ),
    vscode.commands.registerCommand(
      regionCommandIds.deleteAll,
      () => region.deleteAllAcrossWorkspaceCommand(),
    ),
  ]

  const packagerDisposables = [
    vscode.window.registerTreeDataProvider(
      views.packager.listDeps,
      nodeDependenciesProvider,
    ),
    vscode.window.registerWebviewViewProvider(
      views.packager.installDeps,
      nodeDependenciesWebviewViewProvider,
    ),
    vscode.commands.registerCommand(
      packagerCommandIds.refreshEntry,
      () => nodeDependenciesProvider.refreshCommand(),
    ),
    vscode.commands.registerCommand(
      packagerCommandIds.link,
      (dep?: DependencyTreeItem) => nodeDependenciesProvider.linkCommand(dep),
    ),
    vscode.commands.registerCommand(
      packagerCommandIds.remove,
      (dep?: DependencyTreeItem) => nodeDependenciesProvider.removeCommand(dep),
    ),
    vscode.commands.registerCommand(
      packagerCommandIds.updateAll,
      () => nodeDependenciesProvider.updateAllCommand(),
    ),
    vscode.commands.registerCommand(
      packagerCommandIds.updateSingle,
      (dep?: DependencyTreeItem) => nodeDependenciesProvider.updateSingleCommand(dep),
    ),
  ]

  const delinerDisposables = [
    vscode.commands.registerCommand(
      delinerCommandIds.deleteAll,
      () => Deliner.deleteAllAcrossWorkspace(),
    ),
  ]

  const commonDisposables = [
    vscode.commands.registerCommand(
      commonCommandIds.initPackageJson,
      () => executeInitPackageJson(),
    ),
  ]

  const listenerDisposables = [
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor)
        return

      highlight.triggerUpdateHighlight()
      colorize.triggerUpdateColorize()
    }),

    vscode.workspace.onDidChangeTextDocument((event) => {
      if (!vscode.window.activeTextEditor || vscode.window.activeTextEditor.document !== event.document)
        return

      highlight.triggerUpdateHighlight()
      colorize.triggerUpdateColorize()
    }),

    vscode.workspace.onDidChangeConfiguration((event) => {
      highlight.handleChangeConfiguration(event)
      colorize.handleChangeConfiguration(event)
      Packager.handleChangeConfiguration(event, nodeDependenciesProvider)
    }),
  ]

  context.subscriptions.push(
    ...highlightDisposables,
    ...fileNestingDisposables,
    ...colorizeDisposables,
    ...loggerDisposables,
    ...regionDisposables,
    ...packagerDisposables,
    ...delinerDisposables,
    ...commonDisposables,
    ...listenerDisposables,
  )
}

export function deactivate() {
  highlight.dispose()
}
