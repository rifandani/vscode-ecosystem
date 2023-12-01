import vscode from 'vscode'
import { commands as highlightCommand, listAnnotationsCommand, showOutputChannelCommand, toggleIsEnableCommand } from './commands/highlight'
import { applyCommand, commands as fileNestingCommand, removeCommand } from './commands/file-nesting'
import { init as initHighlight, triggerUpdateHighlight } from './utils/highlight'
import { defaultState, diagnostics, state } from './constants/globals'
import { getColorizeConfig, getHighlightConfig } from './utils/config'
import { triggerUpdateColorize } from './utils/colorize'
import { commands as colorizeCommand, toggleEnabledCommand } from './commands/colorize'

export async function activate(context: vscode.ExtensionContext) {
  // initialize all necessary things for "highlight"
  initHighlight()

  // trigger update "highlight" & "colorize" for the first time
  if (vscode.window.activeTextEditor) {
    triggerUpdateHighlight()
    triggerUpdateColorize()
  }

  const highlightDisposables = [
    diagnostics.highlight,
    vscode.commands.registerCommand(
      highlightCommand.toggleIsEnable,
      toggleIsEnableCommand,
    ),
    vscode.commands.registerCommand(
      highlightCommand.listAnnotations,
      listAnnotationsCommand,
    ),
    vscode.commands.registerCommand(
      highlightCommand.showOutputChannel,
      showOutputChannelCommand,
    ),
  ]

  const fileNestingDisposables = [
    vscode.commands.registerCommand(
      fileNestingCommand.apply,
      applyCommand,
    ),
    vscode.commands.registerCommand(
      fileNestingCommand.remove,
      removeCommand,
    ),
  ]

  const colorizeDisposables = [
    vscode.commands.registerTextEditorCommand(colorizeCommand.toggleEnabled, toggleEnabledCommand),
  ]

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

    vscode.workspace.onDidChangeConfiguration(() => {
      const { isEnable } = getHighlightConfig()
      const { enabled } = getColorizeConfig()

      // if disabled, do not re-initialize & update highlight
      // or we will not be able to clear the style immediately via 'toggle highlight' command
      if (!isEnable || enabled)
        return

      initHighlight()
      triggerUpdateHighlight()

      triggerUpdateColorize()
    }),
  ]

  const disposables: vscode.Disposable[] = [
    ...highlightDisposables,
    ...fileNestingDisposables,
    ...colorizeDisposables,
    ...listenerDisposables,
  ]

  context.subscriptions.push(...disposables)
}

export function deactivate() {
  // reset global state to default state
  state.highlight = { ...defaultState.highlight }
  state.colorize = { ...defaultState.colorize }
}
