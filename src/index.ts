import vscode from 'vscode'
import { disposables as highlightDisposables } from './commands/highlight'
import { disposables as fileNestingDisposables } from './commands/file-nesting'
import { disposables as loggerDisposables } from './commands/logger'
import { disposables as regionDisposables } from './commands/region'
import { initCommands as initPackagerCommands } from './commands/packager'
import { disposables as delinerDisposables } from './commands/deliner'
import { handleChangeConfiguration as handleChangeConfigurationHighlight, init as initHighlight, triggerUpdateHighlight } from './utils/highlight'
import { NodeDependenciesProvider, handleChangeConfiguration as handleChangeConfigurationPackager } from './utils/packager'
import { diagnostics } from './constants/globals'
import { Colorize } from './modules/colorize'
import { commandIds as colorizeCommandIds } from './constants/colorize'

export async function activate(context: vscode.ExtensionContext) {
  const colorize = new Colorize()

  // initialize all necessary things for "highlight"
  initHighlight()

  // initialize all necessary things for "packager"
  const nodeDependenciesProvider = new NodeDependenciesProvider()
  const packagerDisposables = initPackagerCommands(nodeDependenciesProvider)

  // trigger update "highlight" & "colorize" for the first time
  if (vscode.window.activeTextEditor) {
    triggerUpdateHighlight()
    colorize.triggerUpdateColorize()
  }

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

      triggerUpdateHighlight()
      colorize.triggerUpdateColorize()
    }),

    vscode.workspace.onDidChangeTextDocument((event) => {
      if (!vscode.window.activeTextEditor || vscode.window.activeTextEditor.document !== event.document)
        return

      triggerUpdateHighlight()
      colorize.triggerUpdateColorize()
    }),

    vscode.workspace.onDidCloseTextDocument((event) => {
      // reset diagnostic "highlight" for that specific file
      diagnostics.highlight.set(event.uri, [])
    }),

    vscode.workspace.onDidChangeConfiguration((event) => {
      handleChangeConfigurationHighlight(event)
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
