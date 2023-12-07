import vscode from 'vscode'
import { generateRandomEmoji, getFilename } from '../utils/helper'

type RegisterTextEditorCallback = Parameters<typeof vscode.commands.registerTextEditorCommand>[1]

const consoleLogRegex = /\bconsole\.log\s*\(/g
const commentedConsoleLogRegex = /\/\/\s*console\.log\(/g
const entireConsoleLogRegex = /\/\/\s*console\.log\s*\([^)]*\);?|\bconsole\.log\s*\([^)]*\);?/g // also catch the commented console.log or not

/**
 * insert logger based on the cursor position / user selection
 */
const insert: RegisterTextEditorCallback = async () => {
  const editor = vscode.window.activeTextEditor

  if (!editor)
    return

  for (let idx = 0; idx < editor.selections.length; idx++) {
    const selection = editor.selections[idx]
    const cursorPosition = selection.isEmpty ? selection.end : selection.active
    // Get a word-range at the given position
    const rangeUnderCursor = editor.document.getWordRangeAtPosition(cursorPosition)

    // user selection is empty && there is no detected word in the current user cursor position
    if (selection.isEmpty && !rangeUnderCursor)
      continue

    // Get the word at the selection / cursor position
    const word = editor.document.getText(selection.isEmpty ? rangeUnderCursor : selection)
    // Get the current line's text and indentation
    const currentLine = editor.document.lineAt(cursorPosition.line)
    const indentation = currentLine.text.substring(0, currentLine.firstNonWhitespaceCharacterIndex)
    // Generate the console.log statement with the preserved indentation
    const consoleLogStatement = `${indentation}console.log(\`${generateRandomEmoji()} ~ "${getFilename(editor.document.fileName)}" at line ${currentLine.lineNumber + 1}: ${word} -> \`, ${word})\n`
    const consoleLogPosition = new vscode.Position(selection.end.line + 1, 0)

    // perform an edit on the document associated with this text editor
    await editor.edit((builder) => {
      builder.insert(consoleLogPosition, consoleLogStatement)
    })
  }
}

/**
 * comment out all detected `console.log`
 */
const comment: RegisterTextEditorCallback = async () => {
  const editor = vscode.window.activeTextEditor

  if (!editor)
    return

  // Get all occurrences of 'console.log'
  const documentText = editor.document.getText()
  const consoleLogMatches = Array.from(documentText.matchAll(consoleLogRegex))

  // perform an edit on the document associated with this text editor
  await editor.edit((editBuilder) => {
    // Comment out each 'console.log' occurrence
    for (const match of consoleLogMatches) {
      // no match, then continue iteration
      if (!match.index)
        continue

      // get positions and range
      const startPosition = editor.document.positionAt(match.index)
      const endPosition = editor.document.positionAt(match.index + match[0].length)
      const range = new vscode.Range(startPosition, endPosition)

      // e.g "        if (!showClock) setSeconds(0); // console.log('🦙 ~ showClock -> ', showClock);"
      const lineText = editor.document.lineAt(startPosition.line).text
      const isAlreadyCommented = lineText.match(commentedConsoleLogRegex)

      // is already commented, then continue iteration
      if (isAlreadyCommented)
        continue

      // append "// " to the 'console.log' occurrence
      const commentText = `// `
      editBuilder.replace(range.start, commentText)
    }
  })
}

/**
 * uncomment out all commented `console.log`
 */
const uncomment: RegisterTextEditorCallback = async () => {
  const editor = vscode.window.activeTextEditor

  if (!editor)
    return

  // Get all occurrences of '// console.log'
  const documentText = editor.document.getText()
  const consoleLogMatches = Array.from(documentText.matchAll(commentedConsoleLogRegex))

  // perform an edit on the document associated with this text editor
  await editor.edit((editBuilder) => {
    // Uncomment each commented 'console.log' occurrence
    for (const match of consoleLogMatches) {
      // no match, then continue iteration
      if (!match.index)
        continue

      // get positions and range
      const startPosition = editor.document.positionAt(match.index)
      const endPosition = editor.document.positionAt(match.index + match[0].length)
      const range = new vscode.Range(startPosition, endPosition)

      // e.g "//      console.log("
      const text = editor.document.getText(range)

      const uncommentedText = text.replace(/^\s*\/\/\s*/, '')
      editBuilder.replace(range, uncommentedText)
    }
  })
}

/**
 * delete all `console.log` occurences, wether it's commented or not
 */
const deleteAll: RegisterTextEditorCallback = async () => {
  const editor = vscode.window.activeTextEditor

  if (!editor)
    return

  // Get all occurrences of 'console.log'
  const documentText = editor.document.getText()
  const consoleLogMatches = Array.from(documentText.matchAll(entireConsoleLogRegex))

  // perform an edit on the document associated with this text editor
  await editor.edit((editBuilder) => {
    // Delete each 'console.log' occurrence
    for (const match of consoleLogMatches) {
      // no match, then continue iteration
      if (!match.index)
        continue

      // get positions and range
      const startPosition = editor.document.positionAt(match.index)
      const endPosition = editor.document.positionAt(match.index + match[0].length)
      const range = new vscode.Range(startPosition, endPosition)

      editBuilder.delete(range)
    }
  })
}

export const commandIds = {
  insert: 'veco.logger.insert',
  comment: 'veco.logger.comment',
  uncomment: 'veco.logger.uncomment',
  delete: 'veco.logger.delete',
} as const

export const disposables = [
  vscode.commands.registerCommand(
    commandIds.insert,
    insert,
  ),
  vscode.commands.registerCommand(
    commandIds.comment,
    comment,
  ),
  vscode.commands.registerCommand(
    commandIds.uncomment,
    uncomment,
  ),
  vscode.commands.registerCommand(
    commandIds.delete,
    deleteAll,
  ),
]
