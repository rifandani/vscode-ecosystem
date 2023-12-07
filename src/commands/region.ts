import vscode from 'vscode'
import { template } from '@rifandani/nxact-yutiriti'
import { getLanguageCommentFormat } from '../utils/region'

type RegisterTextEditorCallback = Parameters<typeof vscode.commands.registerTextEditorCommand>[1]

const regionRegex = /#(?:region|Region)|#pragma region|#endregion|#pragma endregion|#End Region/g

/**
 * create region marker based on the cursor position / user selection
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
    await editor.edit(editBuilder => editBuilder.replace(selection, wrappedCode))

    // format the document
    await vscode.commands.executeCommand('editor.action.formatDocument')
  }
}

/**
 * search all "#region" occurrences across the workspace using the vscode built-in `findInFiles` command
 */
const search: RegisterTextEditorCallback = async () => {
  // open the "Find in Files" widget
  await vscode.commands.executeCommand('workbench.actions.findInFiles')

  // simulate typing the search string programmatically
  await vscode.commands.executeCommand('default:type', { text: '#region' })

  // it's not possible to simulate "Enter" programmatically
  vscode.window.showInformationMessage('Please press "Enter" manually to submit the search')
}

/**
 * delete all region marker occurrences in the current document
 */
const deleteInDocument: RegisterTextEditorCallback = async () => {
  const editor = vscode.window.activeTextEditor

  if (!editor)
    return

  // Get all occurrences of region markers
  const text = editor.document.getText()
  const lines = text.split(/\r?\n/)

  await editor.edit((editBuilder) => {
    for (const [lineNumber, line] of lines.entries()) {
      const match = line.match(regionRegex)

      if (!match)
        continue

      const startLinePosition = new vscode.Position(lineNumber, 0)
      const endLinePosition = new vscode.Position(lineNumber, line.length)
      const range = new vscode.Range(startLinePosition, endLinePosition)

      // delete region markers occurrence
      editBuilder.delete(range)
    }
  })

  // format the document
  await vscode.commands.executeCommand('editor.action.formatDocument')
}

export const commandIds = {
  mark: 'veco.region.mark',
  search: 'veco.region.search',
  delete: 'veco.region.delete',
} as const

export const disposables = [
  vscode.commands.registerCommand(
    commandIds.mark,
    mark,
  ),
  vscode.commands.registerCommand(
    commandIds.search,
    search,
  ),
  vscode.commands.registerCommand(
    commandIds.delete,
    deleteInDocument,
  ),
]
