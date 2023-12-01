import vscode from 'vscode'
import { to } from '../utils/helper'
import { getColorizeConfig } from '../utils/config'
import { configs } from '../constants/config'
import { triggerUpdateColorize } from '../utils/colorize'

type RegisterTextEditorCallback = Parameters<typeof vscode.commands.registerTextEditorCommand>[1]

export const commands = {
  toggleEnabled: 'veco.colorize.toggleEnabled',
} as const

/**
 * toggle enable/disable colorize
 *
 * for `commands.toggleEnabled`
 */
export const toggleEnabledCommand: RegisterTextEditorCallback = async () => {
  const { config, enabled } = getColorizeConfig()

  // passing `true` as third arguments will updates user global settings
  const [,err] = await to(config.update(configs.colorize.enabled, !enabled, true))

  if (err) {
    // show error message if failed to update configs
    const errorMsg = `Error ${enabled ? 'disabling' : 'enabling'} colorize`
    vscode.window.showErrorMessage(errorMsg)
  }

  triggerUpdateColorize()
}
