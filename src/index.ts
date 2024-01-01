import vscode from 'vscode'
import { disposables as fileNestingDisposables } from './commands/file-nesting'
import { disposables as loggerDisposables } from './commands/logger'
import { disposables as regionDisposables } from './commands/region'
import { initCommands as initPackagerCommands } from './commands/packager'
import { disposables as delinerDisposables } from './commands/deliner'
import { NodeDependenciesProvider, handleChangeConfiguration as handleChangeConfigurationPackager } from './utils/packager'
import { Colorize } from './modules/colorize'
import { commandIds as colorizeCommandIds } from './constants/colorize'
import { Highlight } from './modules/highlight'
import { commandIds as highlightCommandIds } from './constants/highlight'

export async function activate(context: vscode.ExtensionContext) {
  const colorize = new Colorize()
  const highlight = new Highlight()
  highlight.init()

  // initialize all necessary things for "packager"
  const nodeDependenciesProvider = new NodeDependenciesProvider()
  const packagerDisposables = initPackagerCommands(nodeDependenciesProvider)

  // trigger update "highlight" & "colorize" for the first time
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

  const colorizeDisposables = [
    vscode.commands.registerCommand(
      colorizeCommandIds.toggleEnabled,
      () => colorize.toggleEnabledCommand(),
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
