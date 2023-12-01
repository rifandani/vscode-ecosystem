import Color from 'colorjs.io'
import vscode from 'vscode'
import { state } from '../constants/globals'
import { getColorizeConfig } from './config'

/**
 * regex to catch valid hex, rgb, rgba, hsl, display-p3, lch, oklab, and hwb color strings
 *
 * NOTE: it needs "g" flags to works when we `exec` and loop thru its array
 */
// const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/gi
// const rgbRegex = /rgb\(\s*\d+\s*(?:,\s*\d+\s*){0,2}(?:\s*\/\s*(?:\d+\.?\d*|\.\d+))?\)/gi
// const rgbaRegex = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:\d+\.?\d*|\.\d+)\s*\)/gi
// const hslRegex = /hsl\(\s*(\d+(\.\d+)?)deg,\s*(\d+(\.\d+)?)%,\s*(\d+(\.\d+)?)%\s*\)/gi
// const displayP3Regex = /color\(display-p3\s*(?:\d+(\.\d+)?)\s+(?:\d+(\.\d+)?)\s+(?:\d+(\.\d+)?)\)/gi
// const lchRegex = /lch\(\s*(?:\d+(\.\d+)?%?\s+){1,2}\d+(\.\d+)?\s+\d+(\.\d+)?\)/gi
// const oklabRegex = /oklab\(\s*\d+(\.\d+)?%\s+\d+(\.\d+)\s+\d+(\.\d+)\)/gi
// const hwbRegex = /hwb\(\s*(\d+(\.\d+)?)\s*(?:%|\s+)(\d+(\.\d+)?)%\s*(?:%|\s+)(\d+(\.\d+)?)%\)/gi

/**
 * Combined regex pattern for all color types
 *
 * NOTE:
 *
 * rgb\(\s*\d+\s*(?:,\s*\d+\s*){0,2}(?:\s*\/\s*(?:\d+\.?\d*|\.\d+))?\) -> will match will match "rgb(100, 0, 0)" but not "rgb(255 0 0 / 0.5)"
 * rgb\(\s*\d+(\s+\d+){0,2}(?:\s*\/\s*(?:\d+\.?\d*|\.\d+))?\) -> will match "rgb(255 0 0 / 0.5)" but not "rgb(100, 0, 0)"
 *
 * @example
 *
 * // #fff is hex, #000000 is hex, #FFF000 is also hex
 * // rgb(100, 0, 0) is rgb, hsl(217deg, 90%, 61%) is hsl
 * // rgb(255 0 0 / 0.5) or rgba(255, 0, 0, 0.5) is rgba
 * // color(display-p3 1 1 0) is display p-3, lch(55% 132 95) is lch
 * // oklab(59% 0.1 0.1) is oklab, hwb(194 50% 20%) is hwb
 */
const combinedRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b|rgb\(\s*\d+\s*(?:,\s*\d+\s*){0,2}(?:\s*\/\s*(?:\d+\.?\d*|\.\d+))?\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:\d+\.?\d*|\.\d+)\s*\)|hsl\(\s*(\d+(\.\d+)?)deg,\s*(\d+(\.\d+)?)%,\s*(\d+(\.\d+)?)%\s*\)|lch\(\s*(?:\d+(\.\d+)?%?\s+){1,2}\d+(\.\d+)?\s+\d+(\.\d+)?\)|color\(display-p3\s*(?:\d+(\.\d+)?)\s+(?:\d+(\.\d+)?)\s+(?:\d+(\.\d+)?)\)|oklab\(\s*\d+(\.\d+)?%\s+\d+(\.\d+)\s+\d+(\.\d+)\)|hwb\(\s*(\d+(\.\d+)?)\s*(?:%|\s+)(\d+(\.\d+)?)%\s*(?:%|\s+)(\d+(\.\d+)?)%\)/ig

/**
 * get a contrast color based on input luminance
 */
function getContrastColor(luminance: number) {
  // Determine contrast color
  return luminance > 0.5 ? '#000000' : '#ffffff'
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
  const { enabled } = getColorizeConfig()
  if (!enabled)
    return

  const { document, setDecorations } = activeTextEditor
  // get the document text (includes line breaks like \n)
  const text = document.getText()
  const ranges: vscode.Range[] = []

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
