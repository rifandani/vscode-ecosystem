import { Buffer } from 'node:buffer'
import vscode from 'vscode'
import { excludedFiles } from '../utils/region'

/**
 * given the string input, delete all lines matches with the input across the workspace
 */
async function deleteAllAcrossWorkspace() {
  // prompt user to enter the input text
  const inputText = await vscode.window.showInputBox({
    prompt: 'Enter the input text',
  })

  if (!inputText)
    return

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Deleting all ${inputText} occurrences`,
    cancellable: false,
  }, async (progress) => {
    progress.report({ increment: 0, message: 'Starting deletion...' })

    // find all supported file types
    const files = await vscode.workspace.findFiles('**/*.*', excludedFiles)
    const totalFiles = files.length

    const promises = files.map(async (file, idx) => {
      const document = await vscode.workspace.openTextDocument(file)
      const content = document.getText()
      // preserve the original line ending
      const originalLineEnding = content.includes('\n') ? '\n' : '\r'
      const updatedContent = content
        .split(/\r?\n/)
        .filter(line => !line.match(inputText))
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
    vscode.window.showInformationMessage('Delete success!')
  })
}

export const commandIds = {
  deleteAll: 'veco.deliner.deleteAll',
} as const

export const disposables = [
  vscode.commands.registerCommand(
    commandIds.deleteAll,
    () => deleteAllAcrossWorkspace(),
  ),
]
