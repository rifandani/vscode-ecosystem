import vscode from 'vscode'
import { template } from '@rifandani/nxact-yutiriti'
import { getLanguageCommentFormat } from '../utils/region'

type RegisterTextEditorCallback = Parameters<typeof vscode.commands.registerTextEditorCommand>[1]

/**
 * create region marker based on the cursor position / user selection
 *
 * for `commands.mark`
 */
const mark: RegisterTextEditorCallback = async () => {
  const editor = vscode.window.activeTextEditor

  if (!editor)
    return

  const { languageId, getText } = editor.document
  const languageCommentFormat = getLanguageCommentFormat(languageId)

  // prompt user to enter region name for all selections
  const regionName = await vscode.window.showInputBox({
    prompt: 'Enter the region name',
  })

  if (!regionName)
    return

  for (let idx = 0; idx < editor.selections.length; idx++) {
    const selection = editor.selections[idx]
    const text = getText(selection)

    const wrappedCode = template(languageCommentFormat.full, { text, name: regionName })

    // replace selection with wrapped version
    editor.edit(editBuilder => editBuilder.replace(selection, wrappedCode))

    // format the document
    await vscode.commands.executeCommand('editor.action.formatDocument')
  }
}

export const commandIds = {
  mark: 'veco.region.mark',
} as const

export const disposables = [
  vscode.commands.registerCommand(
    commandIds.mark,
    mark,
  ),
]
