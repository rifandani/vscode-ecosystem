import vscode from 'vscode'
import { applyFileNestingSettings, removeFileNestingSettings } from '../utils/file-nesting'

type RegisterTextEditorCallback = Parameters<typeof vscode.commands.registerTextEditorCommand>[1]

export const commands = {
  apply: 'veco.fileNesting.apply',
  remove: 'veco.fileNesting.remove',
} as const

/**
 * applying file nesting config to global/workspace settings
 *
 * for `commands.apply`
 */
export const applyCommand: RegisterTextEditorCallback = async () => {
  const global = 'Apply config in global settings'
  const workspace = 'Apply config in workspace settings'
  const questions: vscode.QuickPickItem[] = [
    { label: global, detail: 'The config will apply globally in all projects' },
    { label: workspace, detail: 'The config will apply specifically in the current workspace' },
  ]
  const answer = await vscode.window.showQuickPick(questions)

  if (!answer)
    return

  const applyGlobally = answer.label === global

  // when we apply in global, remove in workspace, and vice versa
  await applyFileNestingSettings(applyGlobally)
  await removeFileNestingSettings(!applyGlobally)
}

/**
 * removing file nesting config in both global/workspace settings
 *
 * for `commands.remove`
 */
export const removeCommand: RegisterTextEditorCallback = async () => {
  await removeFileNestingSettings()
  await removeFileNestingSettings(false)
}
