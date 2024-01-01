import Color from 'colorjs.io'
import vscode from 'vscode'
import { colorNames, colorsRegex } from '../constants/colorize'
import { configs } from '../constants/config'
import { getColorizeConfig } from '../utils/config'
import { isFileNameOk, to } from '../utils/helper'

export interface ColorizeState {
  timeout: null | NodeJS.Timeout
  decorationTypes: vscode.TextEditorDecorationType[]
}

export class Colorize {
  private _timeout: ColorizeState['timeout'] = null
  private _decorationTypes: ColorizeState['decorationTypes'] = []

  /**
   * get a contrast color based on input luminance
   */
  private getContrastColor(luminance: number) {
    // Determine contrast color
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  /**
   * decoration type mapper based on config property "decorationType"
   */
  private mapDecorationType(color: Color) {
    const { decorationType } = getColorizeConfig()
    const colorStr = color.toString({ format: 'hex' })
    const contrastColor = this.getContrastColor(color.luminance)
    const rules: vscode.DecorationRenderOptions = {
      overviewRulerColor: colorStr,
      overviewRulerLane: vscode.OverviewRulerLane.Center,
    }

    switch (decorationType) {
      case 'outline':
        rules.border = `3px solid ${colorStr}`
        break

      case 'foreground':
        rules.color = colorStr
        break

      case 'underline':
        rules.color = `invalid; border-bottom:solid 2px ${colorStr}`
        break

      case 'dot-after':
        rules.after = {
          contentText: ' ',
          margin: '0.1em 0.2em 0 0.2em',
          width: '0.7em',
          height: '0.7em',
          backgroundColor: colorStr,
        }
        break

      case 'dot-before':
        rules.before = {
          contentText: ' ',
          margin: '0.1em 0.2em 0 0.2em',
          width: '0.7em',
          height: '0.7em',
          backgroundColor: colorStr,
        }
        break

      case 'background':
      default:
        rules.backgroundColor = colorStr
        rules.color = contrastColor
        rules.border = `3px solid ${colorStr}`
        rules.borderRadius = '3px'
    }

    return rules
  }

  /**
   * get all combined color names regex
   */
  private getCombinedColorsRegex() {
    const colorNamesRegex = colorNames.join('|')
    const combinedRegex = new RegExp(`#(?:[0-9a-fA-F]{3}){1,2}\\b|rgb\\(\\s*\\d+\\s*(?:,\\s*\\d+\\s*){0,2}(?:\\s*\\/\\s*(?:\\d+\\.?\\d*|\\.\\d+))?\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*(?:\\d+\\.?\\d*|\\.\\d+)\\)|hsl\\(\\s*(\\d+(\\.\\d+)?)deg,\\s*(\\d+(\\.\\d+)?)%,\\s*(\\d+(\\.\\d+)?)%\\)|lch\\(\\s*(?:\\d+(\\.\\d+)?%?\\s+){1,2}\\d+(\\.\\d+)?\\s*\\)|oklab\\(\\s*(?:\\d+(\\.\\d+)?%?\\s+){2}\\d+(\\.\\d+)?\\s*\\)|hwb\\(\\s*(\\d+(\\.\\d+)?)\\s*(?:%|\\s+)(\\d+(\\.\\d+)?)%\\s*(?:%|\\s+)(\\d+(\\.\\d+)?)%\\)|color\\(display-p3\\s*(?:\\d+(\\.\\d+)?)\\s+(?:\\d+(\\.\\d+)?)\\s+(?:\\d+(\\.\\d+)?)\\)|${colorNamesRegex}`, 'ig')

    return combinedRegex
  }

  /**
   * clear all used `this._decorationTypes` state across all editors
   * and reset it's array to empty
   */
  private clearDecorations() {
    for (const _decorationType of this._decorationTypes) {
      // clean all decorations
      _decorationType.dispose()
    }

    this._decorationTypes = []
  }

  /**
   * reset all internal states
   */
  public resetStates() {
    this._timeout = null
    this._decorationTypes = []
  }

  /**
   * - clear/dispose all decorations first
   * - get document text from the current `activeTextEditor`
   * - loop thru all matches based on the combined colors regex
   * - instantiate the color object, using matched string value
   * - set decorations based on the start/end positions and decoration/styling
   */
  public async updateColors() {
    const { activeTextEditor, createTextEditorDecorationType } = vscode.window
    const { enabled, namedColor, include, exclude } = getColorizeConfig()

    // do not update colors, if user the opened file doesn't fulfill `include` and `exclude` config
    if (!activeTextEditor || !isFileNameOk({ include, exclude, filename: activeTextEditor.document.fileName }))
      return

    // clear/dispose all decorations first
    this.clearDecorations()

    // do not update colors, if user disable it
    if (!enabled)
      return

    const { document, setDecorations } = activeTextEditor
    // get the document text (includes line breaks like \n)
    const text = document.getText()
    const ranges: vscode.Range[] = []
    const combinedRegex = namedColor ? this.getCombinedColorsRegex() : colorsRegex

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
      const decorationType = this.mapDecorationType(color)

      // push to `ranges` array, for later use
      ranges.push(range)
      // set `this._decorationType` state, don't recreate the decorator each time there is an edit, use the same decorator for each call
      this._decorationTypes.push(createTextEditorDecorationType(decorationType))
    }

    this._decorationTypes.forEach((decorationType, idx) => {
      // highlight the value
      setDecorations(decorationType, [ranges[idx]])
    })
  }

  /**
   * clear `this._timeout` state if it exists & call `updateColors` in `setTimeout`
   */
  public triggerUpdateColorize() {
    if (this._timeout)
      clearTimeout(this._timeout)

    this._timeout = setTimeout(() => this.updateColors(), 0)
  }

  /**
   * handle vscode `onDidChangeConfiguration` for colorize config
   */
  public handleChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
    // do not bother to reinitialize, if the colorize config does not changed
    if (event.affectsConfiguration(configs.colorize.root)) {
      const { enabled } = getColorizeConfig()

      // do not bother to reinitialize, if `enabled` is `false`
      if (enabled)
        this.triggerUpdateColorize()
    }
  }

  /**
   * a command to toggle `enabled` config
   */
  public async toggleEnabledCommand() {
    const { config, enabled } = getColorizeConfig()

    // passing `true` as third arguments will updates user global settings
    const [,err] = await to(config.update(configs.colorize.enabled, !enabled, true))

    if (err) {
      // show error message if failed to update configs
      const errorMsg = `Error ${enabled ? 'disabling' : 'enabling'} colorize`
      vscode.window.showErrorMessage(errorMsg)
    }

    this.triggerUpdateColorize()
  }
}
