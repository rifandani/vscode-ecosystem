import vscode from 'vscode'
import { commands as highlightCommand, listAnnotationsCommand, showOutputChannelCommand, toggleEnabledCommand as toggleEnabledHighlightCommand } from './commands/highlight'
import { applyCommand, commands as fileNestingCommand, removeCommand } from './commands/file-nesting'
import { commentCommand, insertCommand, commands as loggerCommand, uncommentCommand } from './commands/logger'
import { init as initHighlight, triggerUpdateHighlight } from './utils/highlight'
import { defaultState, diagnostics, state } from './constants/globals'
import { getColorizeConfig, getHighlightConfig } from './utils/config'
import { triggerUpdateColorize } from './utils/colorize'
import { commands as colorizeCommand, toggleEnabledCommand as toggleEnabledColorizeCommand } from './commands/colorize'

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
      highlightCommand.toggleEnabled,
      toggleEnabledHighlightCommand,
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
    vscode.commands.registerTextEditorCommand(colorizeCommand.toggleEnabled, toggleEnabledColorizeCommand),
  ]

  const loggerDisposables = [
    vscode.commands.registerTextEditorCommand(loggerCommand.insert, insertCommand),
    vscode.commands.registerTextEditorCommand(loggerCommand.comment, commentCommand),
    vscode.commands.registerTextEditorCommand(loggerCommand.uncomment, uncommentCommand),
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
      const { enabled: enabledHighlight } = getHighlightConfig()
      const { enabled: enabledColorize } = getColorizeConfig()

      // if disabled, do not re-initialize & update highlight
      // or we will not be able to clear the style immediately via 'toggle highlight' command
      if (!enabledHighlight || enabledColorize)
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
    ...loggerDisposables,
    ...listenerDisposables,
  ]

  context.subscriptions.push(...disposables)
}

export function deactivate() {
  // reset global state to default state
  state.highlight = { ...defaultState.highlight }
  state.colorize = { ...defaultState.colorize }
}
