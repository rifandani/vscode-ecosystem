import { Buffer } from 'node:buffer'
import vscode from 'vscode'
import { template } from '@rifandani/nxact-yutiriti'
import { deleteRegionMarker, excludedFiles, getLanguageCommentFormat, includedFiles, regionRegex } from '../utils/region'

/**
 * create region marker based on the cursor position / user selection
 */
async function mark() {
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
 * delete all region marker occurrences in the current document
 */
async function deleteInDocument() {
  const editor = vscode.window.activeTextEditor

  if (!editor)
    return

  // `document` is using the current editor document
  await deleteRegionMarker({ editor, document: editor.document })
}

/**
 * delete all region marker occurrences across the workspace
 */
async function deleteAllAcrossWorkspace() {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Deleting all region markers',
    cancellable: false,
  }, async (progress) => {
    progress.report({ increment: 0, message: 'Starting deletion...' })

    // find all supported file types
    const files = await vscode.workspace.findFiles(includedFiles, excludedFiles)
    const totalFiles = files.length

    const promises = files.map(async (file, idx) => {
      const document = await vscode.workspace.openTextDocument(file)
      const content = document.getText()
      // preserve the original line ending
      const originalLineEnding = content.includes('\n') ? '\n' : '\r'
      const updatedContent = content
        .split(/\r?\n/)
        .filter(line => !line.match(regionRegex))
        .join(originalLineEnding)

      // we don't use `editor.edit()` because it needs the document to be opened in the editor
      // by using `fs.writeFile`, we can edit the text content in the background
      await vscode.workspace.fs.writeFile(file, Buffer.from(updatedContent))

      // updates the progress
      const percentageComplete = ((idx + 1) / totalFiles) * 100
      progress.report({ increment: percentageComplete, message: `Processed ${idx + 1} of ${totalFiles} files` })
    })

    // run as parallel
    await Promise.allSettled(promises)

    // Show an information message
    vscode.window.showInformationMessage('All region markers deleted!')
  })
}

export const commandIds = {
  mark: 'veco.region.mark',
  delete: 'veco.region.delete',
  deleteAll: 'veco.region.deleteAll',
} as const

export const disposables = [
  vscode.commands.registerCommand(
    commandIds.mark,
    () => mark(),
  ),
  vscode.commands.registerCommand(
    commandIds.delete,
    () => deleteInDocument(),
  ),
  vscode.commands.registerCommand(
    commandIds.deleteAll,
    () => deleteAllAcrossWorkspace(),
  ),
]
