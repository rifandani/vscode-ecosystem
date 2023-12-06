import vscode from 'vscode'
import { getHighlightConfig } from '../utils/config'
import { escapeRegExp, to } from '../utils/helper'
import { searchAnnotations, showOutputChannel, triggerUpdateHighlight } from '../utils/highlight'
import { diagnostics, state } from '../constants/globals'
import { configs } from '../constants/config'

type RegisterTextEditorCallback = Parameters<typeof vscode.commands.registerTextEditorCommand>[1]

/**
 * toggle enable/disable highlight
 *
 * for `commands.toggleEnabled`
 */
const toggleEnabled: RegisterTextEditorCallback = async () => {
  const { config, enabled } = getHighlightConfig()

  // passing `true` as third arguments will updates user global settings
  const [,err] = await to(config.update(configs.highlight.enabled, !enabled, true))

  if (err) {
    // show error message if failed to update configs
    const errorMsg = `Error ${enabled ? 'disabling' : 'enabling'} highlight`
    vscode.window.showErrorMessage(errorMsg)
  }

  triggerUpdateHighlight()
}

/**
 * List all user comments/annotations based on the user provided / default settings
 *
 * for `commands.listAnnotations`
 */
const listAnnotations: RegisterTextEditorCallback = async () => {
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

export const commandIds = {
  toggleEnabled: 'veco.highlight.toggleEnabled',
  listAnnotations: 'veco.highlight.listAnnotations',
  showOutputChannel: 'veco.highlight.showOutputChannel',
} as const

export const disposables = [
  diagnostics.highlight,
  vscode.commands.registerCommand(
    commandIds.toggleEnabled,
    toggleEnabled,
  ),
  vscode.commands.registerCommand(
    commandIds.listAnnotations,
    listAnnotations,
  ),
  vscode.commands.registerCommand(
    commandIds.showOutputChannel,
    () => showOutputChannel(state.highlight.annotationList),
  ),
]
