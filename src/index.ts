import vscode from 'vscode'
import { disposables as delinerDisposables } from './commands/deliner'
import { Colorize } from './modules/colorize'
import { commandIds as colorizeCommandIds } from './constants/colorize'
import { Highlight } from './modules/highlight'
import { commandIds as highlightCommandIds } from './constants/highlight'
import { FileNesting } from './modules/file-nesting'
import { commandIds as fileNestingCommandIds } from './constants/file-nesting'
import { Logger } from './modules/logger'
import { commandIds as loggerCommandIds } from './constants/logger'
import { Region } from './modules/region'
import { commandIds as regionCommandIds } from './constants/region'
import { views } from './constants/config'
import { commandIds as commonCommandIds } from './constants/common'
import { executeInitPackageJson } from './utils/helper'
import { commandIds as packagerCommandIds } from './constants/packager'
import type { DependencyTreeItem } from './modules/packager'
import { NodeDependenciesProvider, Packager } from './modules/packager'

export async function activate(context: vscode.ExtensionContext) {
  const highlight = new Highlight()
  const fileNesting = new FileNesting()
  const colorize = new Colorize()
  const logger = new Logger()
  const region = new Region()

  // init "highlight" internal states
  highlight.init()
  // init "packager" providers
  const nodeDependenciesProvider = new NodeDependenciesProvider()

  // trigger update "highlight" and "colorize" for the first time
  if (vscode.window.activeTextEditor) {
    highlight.triggerUpdateHighlight()
    colorize.triggerUpdateColorize()
  }

  const highlightDisposables = [
    highlight.diagnostic,
    vscode.commands.registerCommand(
      highlightCommandIds.toggleEnabled,
      () => highlight.toggleEnabledCommand(),
    ),
    vscode.commands.registerCommand(
      highlightCommandIds.listAnnotations,
      () => highlight.listAnnotationsCommand(),
    ),
    vscode.commands.registerCommand(
      highlightCommandIds.showOutputChannel,
      () => highlight.showOutputChannelCommand(),
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
      () => logger.insertCommand(),
    ),
    vscode.commands.registerCommand(
      loggerCommandIds.comment,
      () => logger.commentCommand(),
    ),
    vscode.commands.registerCommand(
      loggerCommandIds.uncomment,
      () => logger.uncommentCommand(),
    ),
    vscode.commands.registerCommand(
      loggerCommandIds.delete,
      () => logger.deleteAllCommand(),
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
      views.veco_packager,
      nodeDependenciesProvider,
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

    vscode.workspace.onDidCloseTextDocument((event) => {
      highlight.resetDiagnostic(event.uri)
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
