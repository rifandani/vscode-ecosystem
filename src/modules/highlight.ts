import os from 'node:os'
import vscode from 'vscode'
import { objectify } from '@rifandani/nxact-yutiriti'
import type { KeywordObject } from '../constants/config'
import { configs, highlightDefaultConfig } from '../constants/config'
import { getHighlightConfig } from '../utils/config'
import { escapeRegExp, escapeRegExpGroups, getContent, getPaths, isFileNameOk, to } from '../utils/helper'
import { commandIds } from '../constants/highlight'

// #region INTERFACES
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
  _timeout: null | NodeJS.Timeout
  _styleForRegExp: null | vscode.DecorationRenderOptions
  _assembledData: null | Record<PropertyKey, KeywordObject>
  _decorationTypes: Record<PropertyKey, vscode.TextEditorDecorationType>
  _pattern: string | RegExp
  _annotationList: HighlightAnnotation[]
}
// #endregion

const zapIcon = '$(zap)'
const defaultIcon = '$(checklist)'
const warnIcon = '$(warning)'
const errorIcon = '$(error)'
const errorMsg = 'Error listing annotations'

class Highlight {
  private _timeout: HighlightState['_timeout'] = null
  private _styleForRegExp: HighlightState['_styleForRegExp'] = null
  /**
   * @example
   *
   * {
   *   "NOTE:": {
   *     color: "#fff",
   *     backgroundColor: "rgba(27,154,170,1)",
   *     text: "NOTE:",
   *     overviewRulerColor: "rgba(27,154,170,0.8)",
   *   },
   *   "TODO:": {
   *     color: "#fff",
   *     backgroundColor: "rgba(255,197,61,1)",
   *     text: "TODO:",
   *     overviewRulerColor: "rgba(255,197,61,0.8)",
   *   },
   *   "FIXME:": {
   *     color: "#fff",
   *     backgroundColor: "rgba(239,71,110,1)",
   *     text: "FIXME:",
   *     overviewRulerColor: "rgba(239,71,110,0.8)",
   *   },
   * }
   */
  private _assembledData: HighlightState['_assembledData'] = null
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
  private _decorationTypes: HighlightState['_decorationTypes'] = {}
  /**
   * @example
   *
   * /(NOTE:)|(TODO:)|(FIXME:)/g
   */
  private _pattern: HighlightState['_pattern'] = ''
  private _annotationList: HighlightState['_annotationList'] = []
  private _logOutputChannel: vscode.LogOutputChannel
  private _statusBarItem: vscode.StatusBarItem

  constructor() {
    // instantiate log output channel and status bar item
    this._logOutputChannel = vscode.window.createOutputChannel('Veco - Highlight', { log: true })
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1)
    this._statusBarItem.text = `${defaultIcon} 0 Annotations`
    this._statusBarItem.tooltip = 'Click to show list annotations'
    this._statusBarItem.command = commandIds.showLogOutputChannel
  }

  /**
   * Only used once in `init` function.
   * Based on the user config `defaultStyle`, `isCaseSensitive`, and `keywords`.
   *
   * returns object like this:
   *
   * ```js
   * {
   *   "NOTE:": {
   *     text: "NOTE:",
   *     color: "#fff",
   *     backgroundColor: "rgba(27,154,170,1)",
   *     overviewRulerColor: "rgba(27,154,170,0.8)",
   *   }
   * }
   * ```
   */
  private getAssembledData() {
    this._logOutputChannel.trace(`Operation \`getAssembledData\` start`)

    const { defaultStyle: userDefaultStyle, isCaseSensitive, keywords } = getHighlightConfig()
    // `defaultKeywords` and `result` type looks the same
    const defaultKeywords = objectify(highlightDefaultConfig.keywords, _keyword => _keyword.text)
    const result: Record<PropertyKey, KeywordObject> = {}
    const regex: Array<string | RegExp> = []
    let reg: string | RegExp

    // modifying `result` in each iteration
    for (const val of keywords) {
      let keyword = typeof val === 'string' ? { text: val } : val
      let text = keyword.text

      // in case of the text is empty string
      if (!text)
        continue

      // in case of the text is not case sensitive
      if (!isCaseSensitive)
        text = text.toUpperCase()

      // in case of the text is one of the default keywords
      if (Object.hasOwn(defaultKeywords, text))
        keyword = Object.assign({}, defaultKeywords[text], keyword)

      if (keyword.regex)
        regex.push(keyword.regex.pattern || text)

      result[text] = Object.assign({}, highlightDefaultConfig.defaultStyle, userDefaultStyle, keyword)
    }

    if (regex.length > 0)
      // join the regex array
      reg = regex.join('|')

    // Don't override existing regex keywords with matching defaults
    const regMatchKeyword = Object.keys(defaultKeywords).filter(_keyword => !((reg && _keyword.match(new RegExp(reg)))))
    for (const _key of regMatchKeyword) {
      if (!result[_key])
        result[_key] = Object.assign({}, highlightDefaultConfig.defaultStyle, userDefaultStyle, defaultKeywords[_key])
    }

    this._logOutputChannel.trace(`Operation \`getAssembledData\` end`)
    return result
  }

  /**
   * logic to highlight the annotations
   */
  private updateDecorations() {
    this._logOutputChannel.trace(`Operation \`updateDecorations\` start`)

    const { enabled, isCaseSensitive, keywordsPattern, include, exclude } = getHighlightConfig()

    if (!vscode.window.activeTextEditor || !isFileNameOk({ include, exclude, filename: vscode.window.activeTextEditor.document.fileName })) {
      this._logOutputChannel.debug(`Return early. Filename is not ok`)
      return
    }

    const matches: Record<PropertyKey, Array<{ range: vscode.Range }>> = {}
    const text = vscode.window.activeTextEditor.document.getText()
    let match = (this._pattern as RegExp).exec(text)

    while (match) {
      const startPos = vscode.window.activeTextEditor.document.positionAt(match.index)
      const endPos = vscode.window.activeTextEditor.document.positionAt(match.index + match[0].length)
      const decoration = {
        // Create a new range from two positions.
        range: new vscode.Range(startPos, endPos),
      }

      const patternIndex = match.slice(1).indexOf(match[0])
      // `NOTE:` or `TODO:` or etc...
      let matchedValue = Object.keys(this._decorationTypes)[patternIndex]

      if (!isCaseSensitive)
        matchedValue = matchedValue.toUpperCase()

      if (matches[matchedValue])
        matches[matchedValue].push(decoration)
      else
        matches[matchedValue] = [decoration]

      if ((keywordsPattern as string).trim() && !this._decorationTypes[matchedValue])
        // set `decorationTypes[matchedValue]` state
        this._decorationTypes[matchedValue] = vscode.window.createTextEditorDecorationType(this._styleForRegExp!)

      // re-execute regex pattern based on `text`
      match = (this._pattern as RegExp).exec(text)
    }

    for (const _key in this._decorationTypes) {
      const rangeOption = enabled && matches[_key] ? matches[_key] : []
      const decorationType = this._decorationTypes[_key]

      // NOTE: the actual logic to highlight
      vscode.window.activeTextEditor!.setDecorations(decorationType, rangeOption)
    }

    this._logOutputChannel.trace(`Operation \`updateDecorations\` end`)
  }

  /**
   * search annotations in a specific file, line by line
   *
   * - set `this._annotationList`
   */
  private searchAnnotationsInFile(file: vscode.TextDocument, annotations: Record<PropertyKey, unknown[]>, pattern: string | RegExp) {
    this._logOutputChannel.trace(`Operation \`searchAnnotationInFile\` start`)

    // example "file:///Users/rizeki.rifandani/Desktop/dev/react/react-app/src/index.d.ts"
    const fileUri = file.uri.toString()
    // take only first 7 chars, without "file:///"
    const pathWithoutFile = fileUri.substring(7, fileUri.length)

    for (let lineNum = 0; lineNum < file.lineCount; lineNum++) {
      const lineText = file.lineAt(lineNum).text
      const match = lineText.match(pattern)

      if (!match)
        continue

      if (!Object.hasOwn(annotations, pathWithoutFile))
        annotations[pathWithoutFile] = []

      let label = getContent(lineText, match)
      if (label.length > 500)
        label = `${label.substring(0, 500).trim()}...`

      const rootPath = `${vscode.workspace.workspaceFolders?.[0] ?? vscode.workspace.rootPath}/`
      const outputFile = pathWithoutFile.replace(rootPath, '')
      const startCol = lineText.indexOf(match[0])
      const endCol = lineText.length
      const detail = `${outputFile} ${lineNum + 1}:${startCol + 1}`
      const annotation = {
        startCol,
        endCol,
        label,
        detail,
        lineNum,
        uri: fileUri,
        fileName: pathWithoutFile,
      }

      // update `this._annotationList` array
      this._annotationList.push(annotation)
      annotations[pathWithoutFile].push(annotation)
    }

    this._logOutputChannel.trace(`Operation \`searchAnnotationInFile\` end`)
  }

  /**
   * find files across all the workspace folders based on the `include` / `exclude` config.
   */
  private async searchAnnotationsInWorkspace(pattern: string | RegExp) {
    this._logOutputChannel.trace(`Operation \`searchAnnotationsAcrossWorkspace\` start`)

    const { include, exclude, maxFilesForSearch } = getHighlightConfig()
    const includePattern = getPaths(include) || '{**/*}'
    const excludePattern = getPaths(exclude)
    const statusMsg = ` Searching...`

    // set status bar item text
    this._statusBarItem.show()
    this._statusBarItem.text = `${zapIcon} ${statusMsg}`

    // actual use of "maxFilesForSearch" config
    // find files across all workspace folders in the workspace.
    const [files, err] = await to(vscode.workspace.findFiles(includePattern, excludePattern, maxFilesForSearch))

    // on error finding files
    if (err) {
      this._statusBarItem.text = `${errorIcon} ${errorMsg}`
      this._logOutputChannel.error('Return early. Error finding files', err)
      return
    }

    // on empty files
    if (!files || files.length === 0) {
      const warnMsg = 'No files found'
      this._statusBarItem.text = `${warnIcon} ${warnMsg}`
      this._logOutputChannel.warn(`Return early. ${warnMsg}`, { includePattern, excludePattern })
      return
    }

    let times = 0
    let progress = 0
    const totalFiles = files.length
    const annotations = {}

    const file_iterated = () => {
      times += 1
      progress = Math.floor(times / totalFiles * 100)

      // set status bar item text progress
      this._statusBarItem.text = `${zapIcon} ${progress}% ${statusMsg}`

      if (times === totalFiles) {
        const foundLength = this._annotationList.length
        const msg = `${foundLength} annotations found`

        this._statusBarItem.text = `${defaultIcon} ${foundLength} annotations`
        this._statusBarItem.tooltip = msg
        this._logOutputChannel.debug(msg)
        this.showLogOutputChannelCommand()
      }
    }

    for (let i = 0; i < totalFiles; i++) {
      // opens a document.
      // Will return early if this document is already open.
      // Otherwise the document is loaded and the didOpen-event fires.
      const [file, err] = await to(vscode.workspace.openTextDocument(files[i]))

      if (err) {
        this._statusBarItem.text = `${errorIcon} ${errorMsg}`
        this._logOutputChannel.error(`Error opening text document for ${files[i].fsPath}`, err)
        file_iterated()
        continue
      }

      this.searchAnnotationsInFile(file!, annotations, pattern)
      file_iterated()
    }

    this._logOutputChannel.trace(`Operation \`searchAnnotationsAcrossWorkspace\` end`)
  }

  /**
   * init internal states:
   *
   * - set `this._statusBarItem`
   * - set `this._outputChannel`
   * - set `this._pattern`
   *
   * if `keywordsPattern` is NOT empty:
   *
   * - set `this._styleForRegExp`
   *
   * if `keywordsPattern` is empty:
   *
   * - set `this._assembledData`
   * - set `this._decorationTypes`
   */
  public init() {
    this._logOutputChannel.trace(`Operation \`init\` start`)

    const { defaultStyle: userDefaultStyle, keywordsPattern, isCaseSensitive } = getHighlightConfig()

    if ((keywordsPattern as string).trim()) {
      this._logOutputChannel.debug(`Proceed with defined \`keywordsPattern\``)

      // construct `_styleForRegExp`
      this._styleForRegExp = {
        ...highlightDefaultConfig.defaultStyle,
        ...userDefaultStyle,
        overviewRulerLane: vscode.OverviewRulerLane.Right,
      }
      // set the `_pattern`, but as string
      this._pattern = keywordsPattern
    }
    else {
      this._logOutputChannel.debug(`Proceed with empty \`keywordsPattern\``)

      // set the `_assembledData`
      this._assembledData = this.getAssembledData()

      for (const _key in this._assembledData) {
        const mergedStyle = {
          overviewRulerLane: vscode.OverviewRulerLane.Right,
          ...this._assembledData![_key],
        }

        if (!mergedStyle.overviewRulerColor) {
          // use `backgroundColor` as the default `overviewRulerColor` if not specified by the user setting
          mergedStyle.overviewRulerColor = mergedStyle.backgroundColor
        }

        // set the `decorationTypes` for a specific `_key`
        (this._decorationTypes as Record<PropertyKey, vscode.TextEditorDecorationType>)[_key] = vscode.window.createTextEditorDecorationType(mergedStyle)
      }

      // set the `pattern` still as string, give each keyword a group in the pattern
      this._pattern = Object.keys(this._assembledData).map((_key) => {
        // if `regex` is not exists in `keywords` user defined config
        if (this._assembledData && !this._assembledData[_key].regex)
          return `(${escapeRegExp(_key)})`

        const pattern = this._assembledData?.[_key].regex?.pattern || _key

        // ignore unescaped parantheses to avoid messing with our groups
        return `(${escapeRegExpGroups(pattern as string)})`
      }).join('|')
    }

    // override the `pattern` string, and convert it into a regex
    this._pattern = new RegExp((this._pattern as string), isCaseSensitive ? 'g' : 'gi')
    this._logOutputChannel.trace(`Operation \`init\` end`)
  }

  /**
   * clear `this._timeout` state if it exists & call `updateDecorations` in `setTimeout`
   */
  public triggerUpdateHighlight() {
    if (this._timeout)
      clearTimeout(this._timeout)

    this._timeout = setTimeout(() => this.updateDecorations(), 0)
  }

  /**
   * iterate over `annotationList`, append it to the `this._outputChannel` line, and finally show the output channel
   */
  public showLogOutputChannelCommand() {
    this._logOutputChannel.trace(`Operation \`showLogOutputChannelCommand\` start`)

    const { enabled, toggleURI } = getHighlightConfig()

    // if module is not enabled
    if (!enabled) {
      this._logOutputChannel.warn(`Return early. User did not enable the config`)
      vscode.window.showWarningMessage('Please enable the highlight module first')
      return
    }

    // if there are no annotations found
    if (!this._annotationList.length) {
      this._logOutputChannel.warn(`Return early. Please call \`listAnnotationsCommand\` first to populate \`_annotationList\``)
      vscode.window.showWarningMessage('No results (not included file types and individual files are not searched)')
      return
    }

    const platform = os.platform()

    for (const [idx, annotation] of this._annotationList.entries()) {
      /**
       * due to an issue of vscode (https://github.com/Microsoft/vscode/issues/586),
       * in order to make file path clickable within the output channel,
       * the file path differs from platform
       */
      const patternA = `#${idx + 1}\t${annotation.uri}#${annotation.lineNum + 1}`
      const patternB = `#${idx + 1}\t${annotation.uri}:${annotation.lineNum + 1}:${annotation.startCol + 1}`
      const comment = `\t${annotation.label}\n`
      const patterns = [patternA, patternB]

      // for windows
      let patternType = 0
      if (platform === 'linux' || platform === 'darwin') {
        // for linux & mac
        patternType = 1
      }
      if (toggleURI) {
        // NOTE: one actual use of `toggleURI` config
        // toggle `patternType` between 0 or 1
        patternType = +!patternType
      }

      // append the texts to the output channel
      this._logOutputChannel.appendLine(patterns[patternType])
      this._logOutputChannel.appendLine(comment)
    }

    // finally, reveal the output in the UI
    this._logOutputChannel.show()
    this._logOutputChannel.trace(`Operation \`showLogOutputChannelCommand\` end`)
  }

  /**
   * toggle enable/disable highlight
   */
  public async toggleEnabledCommand() {
    this._logOutputChannel.trace(`Operation \`toggleEnabledCommand\` start`)

    const { config, enabled } = getHighlightConfig()

    // passing `true` as third arguments will updates user settings
    const [,err] = await to(config.update(configs.highlight.enabled, !enabled, true))

    if (err) {
      // show error message if failed to update configs
      const msg = `Error ${enabled ? 'disabling' : 'enabling'} highlight`
      this._logOutputChannel.error(`Return early. ${msg}`)
      vscode.window.showErrorMessage(msg)
      return
    }

    this.triggerUpdateHighlight()
    this._logOutputChannel.trace(`Operation \`toggleEnabledCommand\` end`)
  }

  /**
   * List all user comments/annotations based on the user provided / default settings
   */
  public async listAnnotationsCommand() {
    this._logOutputChannel.trace(`Operation \`listAnnotationsCommand\` start`)

    const { keywordsPattern, isCaseSensitive } = getHighlightConfig()

    // if user provi`keywordsPattern` is NOT empty, then use `this._pattern`
    if ((keywordsPattern as string).trim()) {
      this._logOutputChannel.debug(`\`keywordsPattern\` not empty. Search annotations using \`_pattern\``)
      this.searchAnnotationsInWorkspace(this._pattern)
      return
    }

    // `_assembledData` should already be defined if we called `init` beforehand
    if (!this._assembledData) {
      this._logOutputChannel.warn(`Return early. \`_assembledData\` state is empty. Please call \`init\` before calling this command.`)
      return
    }

    const defaultAnnotationTypes = Object.keys(this._assembledData).map(label => ({
      label,
    }))
    const availableAnnotationTypes: vscode.QuickPickItem[] = [{ label: 'ALL', detail: 'Search all supported annotations' }, ...defaultAnnotationTypes]
    const annotationType = await vscode.window.showQuickPick(availableAnnotationTypes)

    // if user didn't pick by clicking "escape" or outside of the quick pick
    if (!annotationType) {
      this._logOutputChannel.debug(`Return early. User did not pick any option`)
      return
    }

    // construct the `searchPattern` regex
    let searchPattern = this._pattern
    if (annotationType.label !== 'ALL') {
      this._logOutputChannel.debug(`User pick ${annotationType.label} option`)
      annotationType.label = escapeRegExp(annotationType.label)
      searchPattern = new RegExp(annotationType.label, isCaseSensitive ? 'g' : 'gi')
    }

    this.searchAnnotationsInWorkspace(searchPattern)
    this._logOutputChannel.trace(`Operation \`listAnnotationsCommand\` end`)
  }

  /**
   * handle vscode `onDidChangeConfiguration` for highlight config
   */
  public handleChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
    // do not bother to reinitialize, if the highlight config does not changed
    if (event.affectsConfiguration(configs.highlight.root)) {
      const { enabled } = getHighlightConfig()

      // do not bother to reinitialize, if `enabled` is `false`
      // or we will not be able to clear the style immediately via 'toggle highlight' command
      if (enabled) {
        this.init()
        this.triggerUpdateHighlight()
      }
    }
  }

  /**
   * dispose all subscriptions / listeners
   */
  public dispose() {
    this._logOutputChannel.dispose()
    this._statusBarItem.dispose()
  }
}

// exports class singleton to prevent multiple invocations
export const highlight = new Highlight()
