import vscode from 'vscode'
import { generateRandomEmoji, getFilename } from '../utils/helper'

type RegisterTextEditorCallback = Parameters<typeof vscode.commands.registerTextEditorCommand>[1]

export const commands = {
  insert: 'veco.logger.insert',
  comment: 'veco.logger.comment', // TODO:
  uncomment: 'veco.logger.uncomment', // TODO:
  delete: 'veco.logger.delete', // TODO:
} as const

const consoleLogRegex = /\bconsole\.log\s*\(/g
const commentedConsoleLogRegex = /\/\/\s*console\.log\(/g

/**
 * insert logger based on the cursor position / user selection
 *
 * for `commands.insert`
 */
export const insertCommand: RegisterTextEditorCallback = async () => {
  const editor = vscode.window.activeTextEditor

  if (!editor)
    return

  for (const selection of editor.selections) {
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
    const consoleLogStatement = `${indentation}console.log('${generateRandomEmoji()} ~ ${getFilename(editor.document.fileName)} -> ${word} ~ ', ${word});\n`
    const consoleLogPosition = new vscode.Position(selection.end.line + 1, 0)

    // perform an edit on the document associated with this text editor
    await editor.edit((builder) => {
      builder.insert(consoleLogPosition, consoleLogStatement)
    })
  }
}

/**
 * comment out all detected `console.log`
 *
 * for `commands.comment`
 */
export const commentCommand: RegisterTextEditorCallback = async () => {
  const editor = vscode.window.activeTextEditor

  if (!editor)
    return

  // Get all occurrences of 'console.log'
  const documentText = editor.document.getText()
  const consoleLogMatches = Array.from(documentText.matchAll(consoleLogRegex))

  // perform an edit on the document associated with this text editor
  editor.edit((editBuilder) => {
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
