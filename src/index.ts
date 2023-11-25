import vscode from 'vscode'
import { commands as highlightCommand, listAnnotationsCommand, showOutputChannelCommand, toggleIsEnableCommand } from './commands/highlight'
import { init, triggerUpdateDecorations } from './utils/highlight'
import { highlightDiagnostics } from './constants/globals'
import { getHighlightConfig } from './utils/config'

export async function activate(context: vscode.ExtensionContext) {
  init()

  if (vscode.window.activeTextEditor)
    triggerUpdateDecorations()

  const disposables: vscode.Disposable[] = [
    highlightDiagnostics,

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

    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        // Show the given document in a text editor.
        vscode.window.showTextDocument(editor?.document)
        triggerUpdateDecorations()
      }
    }),

    vscode.workspace.onDidChangeTextDocument((event) => {
      if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document)
        triggerUpdateDecorations()
    }),

    vscode.workspace.onDidCloseTextDocument((event) => {
      // NOTE: original version -> event.document
      highlightDiagnostics.set(event.uri, [])
    }),

    vscode.workspace.onDidChangeConfiguration(() => {
      const { isEnable } = getHighlightConfig()

      // if disabled, do not re-initialize the data
      // or we will not be able to clear the style immediatly via 'toggle highlight' command
      if (!isEnable)
        return

      init()
      triggerUpdateDecorations()
    }),
  ]

  context.subscriptions.push(...disposables)
}

export function deactivate() {}
