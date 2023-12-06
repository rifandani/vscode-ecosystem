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
    case 'c':
    case 'cpp':
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
        start: `' #region {{name}}`,
        end: `' #endregion`,
        full: `' #region {{name}}\n{{text}}\n' #endregion`,
      }

    case 'css':
    case 'less':
    case 'scss':
    default:
      return {
        start: '/* #region {{name}} */',
        end: '/* #endregion */',
        full: `/* #region {{name}} */\n{{text}}\n/* #endregion */`,
      }
  }
}
