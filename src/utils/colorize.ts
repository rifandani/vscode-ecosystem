import Color from 'colorjs.io'
import vscode from 'vscode'
import { state } from '../constants/globals'
import { colorNames, colorsRegex } from '../constants/colorize'
import { getColorizeConfig } from './config'

/**
 * get a contrast color based on input luminance
 */
function getContrastColor(luminance: number) {
  // Determine contrast color
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * get all combined color names regex
 */
function getCombinedColorsRegex() {
  const colorNamesRegex = colorNames.join('|')
  const combinedRegex = new RegExp(`#(?:[0-9a-fA-F]{3}){1,2}\\b|rgb\\(\\s*\\d+\\s*(?:,\\s*\\d+\\s*){0,2}(?:\\s*\\/\\s*(?:\\d+\\.?\\d*|\\.\\d+))?\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*(?:\\d+\\.?\\d*|\\.\\d+)\\)|hsl\\(\\s*(\\d+(\\.\\d+)?)deg,\\s*(\\d+(\\.\\d+)?)%,\\s*(\\d+(\\.\\d+)?)%\\)|lch\\(\\s*(?:\\d+(\\.\\d+)?%?\\s+){1,2}\\d+(\\.\\d+)?\\s*\\)|oklab\\(\\s*(?:\\d+(\\.\\d+)?%?\\s+){2}\\d+(\\.\\d+)?\\s*\\)|hwb\\(\\s*(\\d+(\\.\\d+)?)\\s*(?:%|\\s+)(\\d+(\\.\\d+)?)%\\s*(?:%|\\s+)(\\d+(\\.\\d+)?)%\\)|color\\(display-p3\\s*(?:\\d+(\\.\\d+)?)\\s+(?:\\d+(\\.\\d+)?)\\s+(?:\\d+(\\.\\d+)?)\\)|${colorNamesRegex}`, 'ig')

  return combinedRegex
}

/**
 * nuke all uses of global `state.colorize.decorationTypes` across all editors
 * and reset it's array to empty
 */
function clearDecorations() {
  for (const globalDecorationType of state.colorize.decorationTypes) {
    // clean all decorations
    globalDecorationType.dispose()
  }

  state.colorize.decorationTypes = []
}

/**
 * - clear/dispose all decorations first
 * - get document text from the current `activeTextEditor`
 * - loop thru all matches based on the `combinedRegex`
 * - instantiate the color object, using matched string value
 * - set decorations based on the start/end positions and decoration/styling
 */
export async function updateColors() {
  const { activeTextEditor, createTextEditorDecorationType } = vscode.window

  if (!activeTextEditor)
    return

  // clear/dispose all decorations first
  clearDecorations()

  // do not update colors, if user disable it
  const { enabled, namedColor } = getColorizeConfig()
  if (!enabled)
    return

  const { document, setDecorations } = activeTextEditor
  // get the document text (includes line breaks like \n)
  const text = document.getText()
  const ranges: vscode.Range[] = []
  const combinedRegex = namedColor ? getCombinedColorsRegex() : colorsRegex

  // loop thru all matches
  for (const match of text.matchAll(combinedRegex)) {
    // if not match, continue iteration
    if (match.index === undefined)
      continue

    // matched value in the first index (e.g #fff, rgb(100, 0, 0), rgba(255, 0, 0, 0.5), hsl(217deg, 90%, 61%), color(display-p3 1 1 0), oklab(59% 0.1 0.1))
    const matchedValue = match[0]
    // use `match.index` as start position
    const startPos = document.positionAt(match.index)
    // calculate `match.index + matchedValue.length` as end position
    const endPos = document.positionAt(match.index + matchedValue.length)
    // Create a new range from two positions.
    const range = new vscode.Range(startPos, endPos)
    // instantiate the color object, using matched string value
    const color = new Color(matchedValue)
    const backgroundColor = color.toString({ format: 'hex' })
    const contrastColor = getContrastColor(color.luminance)

    // push to `ranges` array, for later use
    ranges.push(range)
    // set global `decorationType` state, don't recreate the decorator each time there is an edit, use the same decorator for each call
    state.colorize.decorationTypes.push(createTextEditorDecorationType({
      backgroundColor,
      color: contrastColor,
      overviewRulerColor: backgroundColor,
      overviewRulerLane: vscode.OverviewRulerLane.Center,
    }))
  }

  state.colorize.decorationTypes.forEach((decorationType, idx) => {
    // highlight the value
    setDecorations(decorationType, [ranges[idx]])
  })
}

/**
 * call `updateColors`
 *
 * - set globals `state.colorize.timeout`
 */
export function triggerUpdateColorize() {
  if (state.colorize.timeout)
    clearTimeout(state.colorize.timeout)

  state.colorize.timeout = setTimeout(updateColors, 0)
}
