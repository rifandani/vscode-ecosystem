import vscode from 'vscode'
import type { KeywordObject } from './config'
import { configs } from './config'

export interface HighlightAnnotation {
  startCol: number
  endCol: number
  label: string
  detail: string
  lineNum: number
  uri: string
  fileName: string
}

export interface HighlightState {
  timeout: null | NodeJS.Timeout
  styleForRegExp: null | vscode.DecorationRenderOptions
  assembledData: null | Record<PropertyKey, KeywordObject>
  decorationTypes: Record<PropertyKey, vscode.TextEditorDecorationType>
  pattern: string | RegExp
  annotationList: HighlightAnnotation[]

  // from vscode instance
  statusBarItem: null | vscode.StatusBarItem
  outputChannel: null | vscode.OutputChannel
}

export const state = {
  highlight: {
    timeout: null,
    styleForRegExp: null,
    /**
     * @example
     *
     * {
     *   "NOTE:": {
     *     color: "#fff",
     *     backgroundColor: "rgba(27,154,170,1)",
     *     text: "NOTE:",
     *     diagnosticSeverity: "information",
     *     overviewRulerColor: "rgba(27,154,170,0.8)",
     *   },
     *   "TODO:": {
     *     color: "#fff",
     *     backgroundColor: "rgba(255,197,61,1)",
     *     text: "TODO:",
     *     diagnosticSeverity: "warning",
     *     overviewRulerColor: "rgba(255,197,61,0.8)",
     *   },
     *   "FIXME:": {
     *     color: "#fff",
     *     backgroundColor: "rgba(239,71,110,1)",
     *     text: "FIXME:",
     *     diagnosticSeverity: "error",
     *     overviewRulerColor: "rgba(239,71,110,0.8)",
     *   },
     * }
     */
    assembledData: null,
    /**
     * @example
     *
     * {
     *   "NOTE:": {
     *     key: "TextEditorDecorationType25",
     *     dispose: function(v)},
     *   },
     *   "TODO:": {
     *     key: "TextEditorDecorationType26",
     *     dispose: function(v)},
     *   },
     *   "FIXME:": {
     *     key: "TextEditorDecorationType27",
     *     dispose: function(v)},
     *   },
     * }
     */
    decorationTypes: {},
    /**
     * @example
     *
     * /(NOTE:)|(TODO:)|(FIXME:)/g
     */
    pattern: '',
    annotationList: [],

    // from vscode instance
    statusBarItem: null,
    outputChannel: null,
  } as HighlightState,
}

export const highlightDiagnostics = vscode.languages.createDiagnosticCollection(configs.highlight.root)
