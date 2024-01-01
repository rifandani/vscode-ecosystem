import vscode from 'vscode'
import { disposables as regionDisposables } from './commands/region'
import { initCommands as initPackagerCommands } from './commands/packager'
import { disposables as delinerDisposables } from './commands/deliner'
import { NodeDependenciesProvider, handleChangeConfiguration as handleChangeConfigurationPackager } from './utils/packager'
import { Colorize } from './modules/colorize'
import { commandIds as colorizeCommandIds } from './constants/colorize'
import { Highlight } from './modules/highlight'
import { commandIds as highlightCommandIds } from './constants/highlight'
import { FileNesting } from './modules/file-nesting'
import { commandIds as fileNestingCommandIds } from './constants/file-nesting'
import { Logger } from './modules/logger'
import { commandIds as loggerCommandIds } from './constants/logger'

export async function activate(context: vscode.ExtensionContext) {
  const highlight = new Highlight()
  const fileNesting = new FileNesting()
  const colorize = new Colorize()
  const logger = new Logger()

  // init "highlight" internal states
  highlight.init()
  // init "packager" providers
  const nodeDependenciesProvider = new NodeDependenciesProvider()
  const packagerDisposables = initPackagerCommands(nodeDependenciesProvider)

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
      handleChangeConfigurationPackager(event, nodeDependenciesProvider)
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
    ...listenerDisposables,
  )
}
