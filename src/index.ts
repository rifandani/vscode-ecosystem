import vscode from 'vscode'
import { disposables as highlightDisposables } from './commands/highlight'
import { disposables as fileNestingDisposables } from './commands/file-nesting'
import { disposables as colorizeDisposables } from './commands/colorize'
import { disposables as loggerDisposables } from './commands/logger'
import { disposables as regionDisposables } from './commands/region'
import { initCommands as initPackagerCommands } from './commands/packager'
import { disposables as delinerDisposables } from './commands/deliner'
import { handleChangeConfiguration as handleChangeConfigurationHighlight, init as initHighlight, triggerUpdateHighlight } from './utils/highlight'
import { handleChangeConfiguration as handleChangeConfigurationColorize, triggerUpdateColorize } from './utils/colorize'
import { NodeDependenciesProvider, handleChangeConfiguration as handleChangeConfigurationPackager } from './utils/packager'
import { defaultState, diagnostics, state } from './constants/globals'

export async function activate(context: vscode.ExtensionContext) {
  // initialize all necessary things for "highlight"
  initHighlight()

  // initialize all necessary things for "packager"
  const nodeDependenciesProvider = new NodeDependenciesProvider()
  const packagerDisposables = initPackagerCommands(nodeDependenciesProvider)

  // trigger update "highlight" & "colorize" for the first time
  if (vscode.window.activeTextEditor) {
    triggerUpdateHighlight()
    triggerUpdateColorize()
  }

  const listenerDisposables = [
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor)
        return

      triggerUpdateHighlight()
      triggerUpdateColorize()
    }),

    vscode.workspace.onDidChangeTextDocument((event) => {
      if (!vscode.window.activeTextEditor || vscode.window.activeTextEditor.document !== event.document)
        return

      triggerUpdateHighlight()
      triggerUpdateColorize()
    }),

    vscode.workspace.onDidCloseTextDocument((event) => {
      // reset diagnostic "highlight" for that specific file
      diagnostics.highlight.set(event.uri, [])
    }),

    vscode.workspace.onDidChangeConfiguration((event) => {
      handleChangeConfigurationHighlight(event)
      handleChangeConfigurationColorize(event)
      handleChangeConfigurationPackager(event, nodeDependenciesProvider)
    }),
  ]

  const disposables: vscode.Disposable[] = [
    ...highlightDisposables,
    ...fileNestingDisposables,
    ...colorizeDisposables,
    ...loggerDisposables,
    ...regionDisposables,
    ...packagerDisposables,
    ...delinerDisposables,
    ...listenerDisposables,
  ]

  context.subscriptions.push(...disposables)
}

export function deactivate() {
  // reset global state to default state
  state.highlight = { ...defaultState.highlight }
  state.colorize = { ...defaultState.colorize }
}
