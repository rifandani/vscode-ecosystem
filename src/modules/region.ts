import { Buffer } from 'node:buffer'
import { template } from '@rifandani/nxact-yutiriti'
import vscode from 'vscode'
import { excludedFiles, includedFiles, regionRegex } from '../constants/region'

class Region {
  /**
   * get language comment format for markers, based on the input `languageId`
   */
  private getLanguageCommentFormat(languageId: string) {
    switch (languageId) {
      case 'ansible':
      case 'cmake':
      case 'coffeescript':
      case 'fish':
      case 'perl':
      case 'powershell':
      case 'python':
      case 'shellscript':
      case 'yaml':
        return {
          start: '#region {{name}}',
          end: '#endregion {{name}}',
          full: `#region {{name}}\n{{text}}\n#endregion {{name}}`,
        }

      case 'ahk':
        return {
          start: '; #region {{name}}',
          end: '; #endregion {{name}}',
          full: `; #region {{name}}\n{{text}}\n; #endregion {{name}}`,
        }

      case 'aspnetcorerazor':
        return {
          start: '@* //#region {{name}} *@',
          end: '@* //#endregion {{name}} *@',
          full: `@* //#region {{name}} *@\n{{text}}\n@* //#endregion {{name}} *@`,
        }

      case 'bat':
        return {
          start: ':: #region {{name}}',
          end: ':: #endregion {{name}}',
          full: `:: #region {{name}} \n{{text}}\n:: #endregion {{name}}`,
        }

      case 'astro':
      case 'csharp':
      case 'dart':
      case 'delphi':
      case 'fsharp':
      case 'go':
      case 'java':
      case 'javascript':
      case 'javascriptreact':
      case 'jsonc':
      case 'php':
      case 'rust':
      case 'svelte':
      case 'typescript':
      case 'typescriptreact':
      case 'vue':
        return {
          start: '// #region {{name}}',
          end: '// #endregion {{name}}',
          full: `// #region {{name}} \n{{text}}\n// #endregion {{name}}`,
        }

      case 'c':
      case 'cpp':
        return {
          start: '#pragma region {{name}}',
          end: '#pragma endregion {{name}}',
          full: `#pragma region {{name}} \n{{text}}\n#pragma endregion {{name}}`,
        }

      case 'html':
      case 'markdown':
      case 'xml':
        return {
          start: '<!-- #region {{name}} -->',
          end: '<!-- #endregion {{name}} -->',
          full: `<!-- #region {{name}} -->\n{{text}}\n<!-- #endregion {{name}} -->`,
        }

      case 'vb':
        return {
          start: `#Region {{name}}`,
          end: `#End Region {{name}}`,
          full: `#Region {{name}}\n{{text}}\n'#End Region {{name}}`,
        }

      case 'css':
      case 'less':
      case 'sass':
      case 'scss':
      default:
        return {
          start: '/* #region {{name}} */',
          end: '/* #endregion {{name}} */',
          full: `/* #region {{name}} */\n{{text}}\n/* #endregion {{name}} */`,
        }
    }
  }

  /**
   * delete all occurrences of region markers in the document
   */
  private async deleteRegionMarker({ editor, document }: { editor: vscode.TextEditor, document: vscode.TextDocument }) {
  // get `document` text
    const text = document.getText()
    // split it by lines
    const lines = text.split(/\r?\n/)

    await editor.edit((editBuilder) => {
    // delete region markers in each line
      for (const [lineNumber, line] of lines.entries()) {
        const match = line.match(regionRegex)

        if (!match)
          continue

        // always start on the first line
        const startLinePosition = new vscode.Position(lineNumber, 0)
        // always end on the end of the line
        const endLinePosition = new vscode.Position(lineNumber, line.length)
        const range = new vscode.Range(startLinePosition, endLinePosition)

        // delete region markers occurrence
        editBuilder.delete(range)
      }
    })

    // format the document
    await vscode.commands.executeCommand('editor.action.formatDocument')
  }

  /**
   * a command to create region marker based on the cursor position / user selection
   */
  public async markCommand() {
    const editor = vscode.window.activeTextEditor

    if (!editor)
      return

    const { languageId, getText } = editor.document
    const languageCommentFormat = this.getLanguageCommentFormat(languageId)

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
   * a command to delete all region marker occurrences in the current document
   */
  public async deleteInDocumentCommand() {
    const editor = vscode.window.activeTextEditor

    if (!editor)
      return

    // `document` is using the current editor document
    await this.deleteRegionMarker({ editor, document: editor.document })
  }

  /**
   * a command to delete all region marker occurrences across the workspace
   */
  public async deleteAllAcrossWorkspaceCommand() {
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
}

// exports class singleton to prevent multiple invocations
export const region = new Region()
