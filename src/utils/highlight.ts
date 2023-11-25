import process from 'node:process'
import os from 'node:os'
import vscode from 'vscode'
import { minimatch } from 'minimatch'
import { objectify } from '@rifandani/nxact-yutiriti'
import type { HighlightState } from '../constants/globals'
import { highlightDiagnostics, state } from '../constants/globals'
import type { KeywordObject } from '../constants/config'
import { constants, highlightDefaultConfig } from '../constants/config'
import { commands as highlightCommand } from '../commands/highlight'
import { getHighlightConfig } from './config'
import { to } from './helper'

const zapIcon = '$(zap)'
const defaultIcon = '$(checklist)'
const defaultMsg = '0 Annotations'
const errorIcon = '$(error)'
const errorMsg = 'Error Listing Annotations'
const statusBarItemTooltip = 'List annotations'

/**
 * create a status bar item with left alignment
 *
 * NOTE: triggers `highlightCommand.showOutputChannel`
 */
function createStatusBarItem() {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
  statusBarItem.text = defaultIcon + defaultMsg
  statusBarItem.tooltip = statusBarItemTooltip
  statusBarItem.command = highlightCommand.showOutputChannel

  return statusBarItem
};

/**
 * based on the user config `defaultStyle`, `isCaseSensitive`, and `keywords`
 *
 * returns object like this:
 *
 * ```js
 * {
 *   "NOTE:": {
 *     text: "NOTE:",
 *     diagnosticSeverity: "information",
 *     color: "#fff",
 *     backgroundColor: "rgba(27,154,170,1)",
 *     overviewRulerColor: "rgba(27,154,170,0.8)",
 *   }
 * }
 * ```
 */
function getAssembledData() {
  const {
    defaultStyle: userDefaultStyle,
    isCaseSensitive,
    keywords,
  } = getHighlightConfig()

  // `result` and `defaultKeywords` type looks the same
  const defaultKeywords = objectify(highlightDefaultConfig.keywords, _keyword => _keyword.text)
  const result: Record<PropertyKey, KeywordObject> = {}
  const regex: Array<string | RegExp> = []
  let reg: string | RegExp

  // modifying `result` in each iteration
  keywords.forEach((val) => {
    let keyword = typeof val === 'string' ? { text: val } : val
    let text = keyword.text

    // in case of the text is empty string
    if (!text)
      return

    // in case of the text is not case sensitive
    if (!isCaseSensitive)
      text = text.toUpperCase()

    // in case of the text is one of the default keywords
    if (Object.hasOwn(defaultKeywords, text))
      keyword = Object.assign({}, defaultKeywords[text], keyword)

    if (keyword.regex)
      // NOTE: original code -> regex.pattern || text
      regex.push(keyword.regex.pattern || text)

    // NOTE: original code -> constants.severityMap[keyword.diagnosticSeverity]
    keyword.diagnosticSeverity = keyword?.diagnosticSeverity ?? 'none'
    result[text] = Object.assign({}, highlightDefaultConfig.defaultStyle, userDefaultStyle, keyword)
  })

  if (regex.length > 0)
    // join the regex array
    reg = regex.join('|')

  // Don't override existing regex keywords with matching defaults
  const regMatchKeyword = Object.keys(defaultKeywords).filter(_keyword => !((reg && _keyword.match(new RegExp(reg)))))
  regMatchKeyword.forEach((_key) => {
    if (!result[_key])
      result[_key] = Object.assign({}, highlightDefaultConfig.defaultStyle, userDefaultStyle, defaultKeywords[_key])
  })

  return result
}

/**
 * look behind assertions ("(?<!abc) & (?<=abc)") supported from ECMAScript 2018 and onwards.
 */
function escapeRegExpGroups(str: string) {
  // native in node.js 9 and up.
  if (Number.parseFloat(process.version.replace('v', '')) > 9.0) {
    const grpPattern = /(?<!\\)(\()([^?]\w*(?:\\+\w)*)(\))?/g
    // make group non-capturing
    return str.replace(grpPattern, '$1?:$2$3')
  }
  else {
    return escapeRegExpGroupsLegacy(str)
  }
}

/**
 * remove any unsupported lookbehinds
 */
function escapeRegExpGroupsLegacy(str: string) {
  // Make all groups non-capturing
  return str.replace(/\(\?<[=|!][^)]*\)/g, '').replace(/((?:[^\\]{1}|^)(?:(?:[\\]{2})+)?)(\((?!\?[:|=|!]))([^)]*)(\))/g, '$1$2?:$3$4')
}

/**
 * get paths based on the input `include` / `exclude` config
 */
function getPaths(config: Array<string>) {
  return Array.isArray(config)
    ? `{${config.join(',')},` + `}`
    : (typeof config == 'string' ? config : '')
}

/**
 * checks if the filename matches with the `include` / `exclude` config using `minimatch`
 */
function isFileNameOk(filename: string) {
  const { include, exclude } = getHighlightConfig()

  const includePatterns = getPaths(include) || '{**/*}'
  const excludePatterns = getPaths(exclude)

  // converting glob expressions into JavaScript RegExp objects
  const includeMatch = minimatch(filename, includePatterns)
  const excludeMatch = minimatch(filename, excludePatterns)

  return includeMatch && !excludeMatch
}

/**
 * returns the substring at the specified location
 */
function getContent(lineText: string, match: RegExpExecArray | RegExpMatchArray) {
  return lineText.substring(lineText.indexOf(match[0]), lineText.length)
};

/**
 * actual logic to highlight the annotations
 *
 * side effects:
 *
 * - set global `state.highlight.decorationTypes[matchedValue]`
 */
function updateDecorations() {
  if (!vscode.window.activeTextEditor || !vscode.window.activeTextEditor.document || !isFileNameOk(vscode.window.activeTextEditor.document.fileName))
    return

  const { isEnable, enableDiagnostics, isCaseSensitive, keywordsPattern } = getHighlightConfig()
  const postDiagnostics = !!isEnable && !!enableDiagnostics

  const matches: Record<PropertyKey, Array<{ range: vscode.Range }>> = {}
  const problems: vscode.Diagnostic[] = []
  const text = vscode.window.activeTextEditor.document.getText()
  let match = (state.highlight.pattern as RegExp).exec(text)

  // NOTE: original code -> match = (state.highlight.pattern as RegExp).exec(text)
  while (match) {
    const startPos = vscode.window.activeTextEditor.document.positionAt(match.index)
    const endPos = vscode.window.activeTextEditor.document.positionAt(match.index + match[0].length)
    const decoration = {
      // Create a new range from two positions.
      range: new vscode.Range(startPos, endPos),
    }

    const patternIndex = match.slice(1).indexOf(match[0])
    let matchedValue = Object.keys(state.highlight.decorationTypes)[patternIndex]

    if (postDiagnostics) {
      const lineText = vscode.window.activeTextEditor.document.lineAt(decoration.range.start).text
      let message = getContent(lineText, match)

      if (message.length > 160)
        // take only first 160 chars
        message = `${message.substring(0, 160).trim()}...`

      const severity = state.highlight.assembledData?.[matchedValue]?.diagnosticSeverity
      if (severity) {
        // creates diagnostic
        const problem = new vscode.Diagnostic(decoration.range, message, constants.severityMapper[severity])
        problems.push(problem)
      }
    }

    if (!isCaseSensitive)
      matchedValue = matchedValue.toUpperCase()

    if (matches[matchedValue])
      matches[matchedValue].push(decoration)
    else
      matches[matchedValue] = [decoration]

    if ((keywordsPattern as string).trim() && !state.highlight.decorationTypes[matchedValue])
      // set global `decorationTypes[matchedValue]` state
      state.highlight.decorationTypes[matchedValue] = vscode.window.createTextEditorDecorationType(state.highlight.styleForRegExp!)

    // re-execute regex pattern based on `text`
    match = (state.highlight.pattern as RegExp).exec(text)
  }

  Object.keys(state.highlight.decorationTypes).forEach((_key) => {
    const rangeOption = isEnable && matches[_key] ? matches[_key] : []
    const decorationType = state.highlight.decorationTypes[_key]

    // IMPORTANT: the actual logic to highlight
    vscode.window.activeTextEditor!.setDecorations(decorationType, rangeOption)
  })

  highlightDiagnostics.set(vscode.window.activeTextEditor.document.uri, problems)
}

/**
 * set status bar item text and tooltip
 */
function setStatusMsg(icon: string, message: string | number, tooltip?: string | vscode.MarkdownString) {
  if (!state.highlight.statusBarItem)
    return

  if (tooltip)
    state.highlight.statusBarItem.tooltip = tooltip

  state.highlight.statusBarItem.text = `${icon} ${message}`
  state.highlight.statusBarItem.show()
}

/**
 * set error message to status bar item
 */
function errorHandler(err: unknown) {
  setStatusMsg(errorIcon, errorMsg)
  console.error('Vscode Ecosystem - Highlight error', err)
}

/**
 * iterate over `annotationList`, and append it to the `state.highlight.outputChannel` line.
 *
 * finally show the output channel
 */
export function showOutputChannel(annotationList: HighlightState['annotationList']) {
  if (!state.highlight.outputChannel)
    return

  // if there are no data/annotations found
  if (annotationList.length === 0) {
    vscode.window.showInformationMessage('No results (Not included file types and individual files are not searched)')
    return
  }

  const { toggleURI } = getHighlightConfig()
  const platform = os.platform()

  // clear previous output
  state.highlight.outputChannel.clear()

  annotationList.forEach((annotation, idx) => {
    /**
     * due to an issue of vscode (https://github.com/Microsoft/vscode/issues/586),
     * in order to make file path clickable within the output channel,
     * the file path differs from platform
     *
     * @example
     * #1	file:///Users/rizeki.rifandani/Desktop/dev/react/react-app/src/modules/todo/pages/Todos/Todos.page.test.tsx:22:6
     *   FIXME: TypeError: mutate is not a function
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
    state.highlight.outputChannel!.appendLine(patterns[patternType])
    state.highlight.outputChannel!.appendLine(comment)
  })

  // finally, reveal the output in the UI
  state.highlight.outputChannel.show()
}

/**
 * search annotations in a specific file, line by line
 * side effects:
 *
 * - set global `state.highlight.annotationList`
 */
function searchAnnotationInFile(file: vscode.TextDocument, annotations: Record<PropertyKey, unknown[]>, pattern: string | RegExp) {
  // example "file:///Users/rizeki.rifandani/Desktop/dev/react/react-app/src/index.d.ts"
  const fileUri = file.uri.toString()
  // take only first 7 chars, without "file:///"
  const pathWithoutFile = fileUri.substring(7, fileUri.length)

  for (let lineNum = 0; lineNum < file.lineCount; lineNum++) {
    const lineText = file.lineAt(lineNum).text
    const match = lineText.match(pattern)

    if (!match)
      continue

    if (!Object.prototype.hasOwnProperty.call(annotations, pathWithoutFile))
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

    // update global `annotationList` array
    state.highlight.annotationList.push(annotation)
    annotations[pathWithoutFile].push(annotation)
  }
}

/**
 * find files across all the workspace folders based on the `include` / `exclude` config.
 *
 * side effects:
 *
 * - set global `state.highlight.annotationList`
 */
export async function searchAnnotations(pattern: string | RegExp) {
  const { include, exclude, maxFilesForSearch } = getHighlightConfig()
  const includePattern = getPaths(include) || '{**/*}'
  const excludePattern = getPaths(exclude)
  const statusMsg = ` Searching...`

  // set status bar item to "searching"
  setStatusMsg(zapIcon, statusMsg)

  // actual use of "maxFilesForSearch" config
  // find files across all workspace folders in the workspace.
  const [files, err] = await to(vscode.workspace.findFiles(includePattern, excludePattern, maxFilesForSearch))

  if (err) {
    errorHandler(err)
    return
  }

  if (!files || files.length === 0) {
    errorHandler({ message: 'No files found' })
    return
  }

  let times = 0
  let progress = 0
  const totalFiles = files.length
  const annotations = {}
  // const annotationList: unknown[] = []

  function file_iterated() {
    times += 1
    progress = Math.floor(times / totalFiles * 100)

    // set status bar item to "searching"
    setStatusMsg(zapIcon, `${progress}% ${statusMsg}`)

    if (times === totalFiles) {
      const message = state.highlight.annotationList.length
      const tooltip = `${message} annotations result(s) found`

      // state.highlight.annotationList = annotationList
      setStatusMsg(defaultIcon, message, tooltip)
      showOutputChannel(state.highlight.annotationList)
    }
  }

  for (let i = 0; i < totalFiles; i++) {
    // opens a document.
    // Will return early if this document is already open.
    // Otherwise the document is loaded and the didOpen-event fires.
    const [file, err] = await to(vscode.workspace.openTextDocument(files[i]))

    if (err) {
      errorHandler(err)
      file_iterated()
      continue
    }

    searchAnnotationInFile(file!, annotations, pattern)
    file_iterated()
  }
}

/**
 * to escape special characters in the input string (str)
 * so that it can be safely used as a literal in a regular expression pattern
 * without causing unintended interpretations of the special characters.
 */
export function escapeRegExp(str: string) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

/**
 * init/set all necessary things (side effects):
 *
 * - global `state.highlight.statusBarItem`
 * - global `state.highlight.outputChannel`
 * - global `state.highlight.pattern`
 *
 * if `keywordsPattern` is NOT empty:
 *
 * - global `state.highlight.styleForRegExp`
 *
 * if `keywordsPattern` is empty:
 *
 * - global `state.highlight.assembledData`
 * - global `state.highlight.decorationTypes`
 */
export function init() {
  const {
    defaultStyle: userDefaultStyle,
    keywordsPattern,
    isCaseSensitive,
  } = getHighlightConfig()

  if (!state.highlight.statusBarItem)
    // init status bar item
    state.highlight.statusBarItem = createStatusBarItem()

  if (!state.highlight.outputChannel)
    // init output channel
    state.highlight.outputChannel = vscode.window.createOutputChannel(constants.highlight.outputChannel)

  if ((keywordsPattern as string).trim()) {
    // `userDefaultStyle` overrides `highlightDefaultConfig.defaultStyle`
    state.highlight.styleForRegExp = Object.assign({}, highlightDefaultConfig.defaultStyle, userDefaultStyle, {
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    })

    state.highlight.pattern = keywordsPattern
  }
  else {
    state.highlight.assembledData = getAssembledData()

    Object.keys(state.highlight.assembledData).forEach((_key) => {
      // NOTE: we already done this in `getAssembledData()`
      // if (!isCaseSensitive)
      //   _key = _key.toUpperCase()

      const mergedStyle = Object.assign({}, {
        overviewRulerLane: vscode.OverviewRulerLane.Right,
      }, state.highlight.assembledData![_key])

      if (!mergedStyle.overviewRulerColor) {
        // use `backgroundColor` as the default `overviewRulerColor` if not specified by the user setting
        mergedStyle.overviewRulerColor = mergedStyle.backgroundColor
      }

      // set the global `decorationTypes`
      (state.highlight.decorationTypes as Record<PropertyKey, vscode.TextEditorDecorationType>)[_key] = vscode.window.createTextEditorDecorationType(mergedStyle)
    })

    // give each keyword a group in the pattern
    state.highlight.pattern = Object.keys(state.highlight.assembledData).map((_key) => {
      // if `regex` is not exists in `keywords` user defined config
      if (state.highlight.assembledData && !state.highlight.assembledData[_key].regex)
        return `(${escapeRegExp(_key)})`

      const pattern = state.highlight.assembledData?.[_key].regex?.pattern || _key

      // ignore unescaped parantheses to avoid messing with our groups
      return `(${escapeRegExpGroups(pattern as string)})`
    }).join('|')
  }

  // override the global `pattern` again, based on the previous `pattern`
  state.highlight.pattern = new RegExp((state.highlight.pattern as string), isCaseSensitive ? 'g' : 'gi')
}

/**
 * call `updateDecorations`
 *
 * side effects:
 *
 * - set global `state.highlight.timeout`
 */
export function triggerUpdateDecorations() {
  if (state.highlight.timeout)
    clearTimeout(state.highlight.timeout)

  state.highlight.timeout = setTimeout(updateDecorations, 0)
}
