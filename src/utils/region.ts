import vscode from 'vscode'

export const regionRegex = /#(?:region|Region)|#pragma region|#endregion|#pragma endregion|#End Region/g
export const includedFiles = '**/*.{coffee,fish,pl,perl,ps1,py,sh,yml,yaml,ahk,cshtml,bat,astro,cs,dart,fs,go,java,js,jsx,json,php,rs,svelte,ts,tsx,vue,c,cpp,html,md,xml,vb,css,less,sass,scss}'
export const excludedFiles = '**/{node_modules,bower_components,dev-dist,dist,build,html,coverage,out,.vscode,.vscode-test,.github,_output,.next}/**'

/**
 * get language comment format for markers, based on the input `languageId`
 */
export function getLanguageCommentFormat(languageId: string) {
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
        end: '#endregion',
        full: `#region {{name}}\n{{text}}\n#endregion`,
      }

    case 'ahk':
      return {
        start: '; #region {{name}}',
        end: '; #endregion',
        full: `; #region {{name}}\n{{text}}\n; #endregion`,
      }

    case 'aspnetcorerazor':
      return {
        start: '@* //#region {{name}} *@',
        end: '@* //#endregion *@',
        full: `@* //#region {{name}} *@\n{{text}}\n@* //#endregion *@`,
      }

    case 'bat':
      return {
        start: ':: #region {{name}}',
        end: ':: #endregion',
        full: `:: #region {{name}} \n{{text}}\n:: #endregion`,
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
        end: '// #endregion',
        full: `// #region {{name}} \n{{text}}\n// #endregion`,
      }

    case 'c':
    case 'cpp':
      return {
        start: '#pragma region {{name}}',
        end: '#pragma endregion',
        full: `#pragma region {{name}} \n{{text}}\n#pragma endregion`,
      }

    case 'html':
    case 'markdown':
    case 'xml':
      return {
        start: '<!-- #region {{name}} -->',
        end: '<!-- #endregion -->',
        full: `<!-- #region {{name}} -->\n{{text}}\n<!-- #endregion -->`,
      }

    case 'vb':
      return {
        start: `#Region {{name}}`,
        end: `#End Region`,
        full: `#Region {{name}}\n{{text}}\n'#End Region`,
      }

    case 'css':
    case 'less':
    case 'sass':
    case 'scss':
    default:
      return {
        start: '/* #region {{name}} */',
        end: '/* #endregion */',
        full: `/* #region {{name}} */\n{{text}}\n/* #endregion */`,
      }
  }
}

/**
 * delete all occurrences of region markers in the document
 */
export async function deleteRegionMarker({ editor, document }: { editor: vscode.TextEditor, document: vscode.TextDocument }) {
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
  // await vscode.commands.executeCommand('editor.action.formatDocument')
}
