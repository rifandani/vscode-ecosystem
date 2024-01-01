import vscode from 'vscode'
import { configs, fileNestingDefaultConfig } from '../constants/config'
import { getFileNestingConfig } from '../utils/config'

export class FileNesting {
  /**
   * apply file nesting config in global/workspace settings
   *
   * global by default
   */
  private async applySettings(isGlobal = true) {
    const { config } = getFileNestingConfig()

    await Promise.allSettled([
      config.update(configs.fileNesting.enabled, fileNestingDefaultConfig.enabled, isGlobal),
      config.update(configs.fileNesting.expand, fileNestingDefaultConfig.expand, isGlobal),
      config.update(configs.fileNesting.patterns, fileNestingDefaultConfig.patterns, isGlobal),
    ])
  }

  /**
   * remove file nesting config in global/workspace settings
   *
   * global by default
   */
  private async removeSettings(isGlobal = true) {
    const { config } = getFileNestingConfig()

    await Promise.allSettled([
      config.update(configs.fileNesting.enabled, undefined, isGlobal),
      config.update(configs.fileNesting.expand, undefined, isGlobal),
      config.update(configs.fileNesting.patterns, undefined, isGlobal),
    ])
  }

  /**
   * a command to apply file nesting config to global/workspace settings
   */
  public async applyCommand() {
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
    await this.applySettings(applyGlobally)
    await this.removeSettings(!applyGlobally)
  }

  /**
   * a command to remove file nesting config in both global/workspace settings
   */
  public async removeCommand() {
    await this.removeSettings()
    await this.removeSettings(false)
  }
}
