import vscode from 'vscode'
import { getHighlightConfig } from '../utils/config'
import { to } from '../utils/helper'
import { escapeRegExp, searchAnnotations, showOutputChannel, triggerUpdateDecorations } from '../utils/highlight'
import { state } from '../constants/globals'
import { configs } from '../constants/config'

export const commands = {
  toggleIsEnable: 'veco.highlight.toggleIsEnable',
  listAnnotations: 'veco.highlight.listAnnotations',
  showOutputChannel: 'veco.highlight.showOutputChannel',
} as const

/**
 * 'veco.highlight.toggleIsEnable' command
 */
export async function toggleIsEnableCommand() {
  const { config, isEnable } = getHighlightConfig()

  // passing `true` as third arguments will updates user global settings
  const [,err] = await to(config.update(configs.highlight.isEnable, !isEnable, true))

  if (err) {
    // show error message if failed to update configs
    const errorMsg = `Error ${isEnable ? 'disabling' : 'enabling'} highlight`
    vscode.window.showErrorMessage(errorMsg)
  }

  triggerUpdateDecorations()
}

/**
 * List all user comments/annotations based on the user provided / default settings
 *
 * 'veco.highlight.listAnnotations' command
 */
export async function listAnnotationsCommand() {
  const { keywordsPattern, isCaseSensitive } = getHighlightConfig()

  if ((keywordsPattern as string).trim()) {
    searchAnnotations(state.highlight.pattern)
    return
  }

  if (!state.highlight.assembledData)
    return

  const defaultAnnotationTypes = Object.keys(state.highlight.assembledData).map(label => ({
    label,
  }))
  const availableAnnotationTypes: vscode.QuickPickItem[] = [{ label: 'ALL', detail: 'Search all supported annotations' }, ...defaultAnnotationTypes]
  const annotationType = await vscode.window.showQuickPick(availableAnnotationTypes)

  // if user didn't pick by clicking "escape" or outside of the quick pick
  if (!annotationType)
    return

  let searchPattern = state.highlight.pattern
  if (annotationType.label !== 'ALL') {
    annotationType.label = escapeRegExp(annotationType.label)
    searchPattern = new RegExp(annotationType.label, isCaseSensitive ? 'g' : 'gi')
  }

  searchAnnotations(searchPattern)
}

/**
 * Show the output channel based on the `state.highlight.annotationList`
 *
 * 'veco.highlight.showOutputChannel' command
 */
export function showOutputChannelCommand() {
  showOutputChannel(state.highlight.annotationList)
}
