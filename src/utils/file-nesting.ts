import { configs, fileNestingDefaultConfig } from '../constants/config'
import { getFileNestingConfig } from './config'

/**
 * apply file nesting config in global/workspace settings
 *
 * global by default
 */
export async function applyFileNestingSettings(isGlobal = true) {
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
export async function removeFileNestingSettings(isGlobal = true) {
  const { config } = getFileNestingConfig()

  await Promise.allSettled([
    config.update(configs.fileNesting.enabled, undefined, isGlobal),
    config.update(configs.fileNesting.expand, undefined, isGlobal),
    config.update(configs.fileNesting.patterns, undefined, isGlobal),
  ])
}
