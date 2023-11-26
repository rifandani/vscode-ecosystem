import vscode from 'vscode'

export type CustomDiagnosticSeverity = 'error' | 'warning' | 'information' | 'hint' | 'none'

export interface KeywordObject extends Partial<vscode.DecorationRenderOptions> {
  text: string
  regex?: { pattern: string | RegExp }
  /**
   * @default 'none'
   */
  diagnosticSeverity?: CustomDiagnosticSeverity
}
export type Keyword = string | KeywordObject

export interface HighlightDefaultConfig {
  isEnable: boolean
  toggleURI: boolean
  isCaseSensitive: boolean
  enableDiagnostics: boolean
  maxFilesForSearch: number
  defaultStyle: Partial<vscode.DecorationRenderOptions>
  keywords: Array<Keyword>
  keywordsPattern: string | RegExp
  include: Array<string>
  exclude: Array<string>
}

export const constants = {
  severityMapper: {
    error: vscode.DiagnosticSeverity.Error,
    warning: vscode.DiagnosticSeverity.Warning,
    information: vscode.DiagnosticSeverity.Information,
    hint: vscode.DiagnosticSeverity.Hint,
    none: undefined,
  },
  highlight: {
    outputChannel: 'Vscode Ecosystem - Highlight',
  },
} as const

export const configs = {
  highlight: {
    root: 'veco.highlight',
    isEnable: 'isEnable',
    toggleURI: 'toggleURI',
    isCaseSensitive: 'isCaseSensitive',
    enableDiagnostics: 'enableDiagnostics',
    maxFilesForSearch: 'maxFilesForSearch',
    defaultStyle: 'defaultStyle',
    keywords: 'keywords',
    keywordsPattern: 'keywordsPattern',
    include: 'include',
    exclude: 'exclude',
  },
} as const

export const highlightDefaultConfig = {
  /**
   * Enable or disable the highlighting
   */
  isEnable: true,
  /**
   * If the file path within the output channel is not clickable,
   * set this to true to toggle the path patten between `<path>#<line>` and `<path>:<line>:<column>`
   */
  toggleURI: false,
  /**
   * Specify whether the keywords are case sensitive or not
   */
  isCaseSensitive: true,
  /**
   * Enable creating diagnostic entries for open files in the problems view.
   */
  enableDiagnostics: false,
  /**
   * Max files for searching, mostly you don't need to configure this
   */
  maxFilesForSearch: 5120,
  /**
   * An array of keywords that will be highlighted.
   * You can also specify the style for each keyword here,
   * and a more advanced regex to detect the item to highlight.
   */
  keywords: [
    {
      text: 'NOTE:',
      diagnosticSeverity: 'information',
      color: '#fff',
      backgroundColor: 'rgba(27,154,170,1)',
      overviewRulerColor: 'rgba(27,154,170,0.8)',
    },
    {
      text: 'TODO:',
      diagnosticSeverity: 'warning',
      color: '#fff',
      backgroundColor: 'rgba(255,197,61,1)',
      overviewRulerColor: 'rgba(255,197,61,0.8)',
    },
    {
      text: 'FIXME:',
      diagnosticSeverity: 'error',
      color: '#fff',
      backgroundColor: 'rgba(239,71,110,1)',
      overviewRulerColor: 'rgba(239,71,110,0.8)',
    },
  ],
  /**
   * Specify keywords via regex instead of `veco.highlight.keywords` one by one.
   *
   * NOTE: if this is present, `veco.highlight.keywords` will be ignored.
   * Remember to escape the backslash if there's any in your regex
   * (using \\ (double backslash) instead of single backslash).
   */
  keywordsPattern: '',
  /**
   * Specify the default style for custom keywords, if not specified, build in default style will be applied
   *
   * @link [DecorationRenderOptions](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions)
   */
  defaultStyle: {
    color: '#2196f3',
    backgroundColor: '#ffeb3b',
  },
  /**
   * Glob patterns that defines the files to search for.
   *
   * NOTE: explicitly specifying include patterns will override the default settings,
   * so if you want to add new patterns, and also use the defaults,
   * you will need to include the default patterns as well.
   */
  include: [
    '**/*.js',
    '**/*.jsx',
    '**/*.ts',
    '**/*.tsx',
    '**/*.html',
    '**/*.php',
    '**/*.css',
    '**/*.scss',
  ],
  /**
   * Glob pattern that defines files and folders to exclude while listing annotations.
   *
   * NOTE: explicitly specifying exclude patterns will override the default settings,
   * so if you want to add new patterns, and also use the defaults,
   * you will need to include the default patterns as well.
   */
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/bower_components/**',
    '**/build/**',
    '**/.vscode/**',
    '**/.github/**',
    '**/_output/**',
    '**/*.min.*',
    '**/*.map',
  ],
} satisfies HighlightDefaultConfig
