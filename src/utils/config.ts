import vscode from 'vscode'
import type { ColorizeDefaultConfig, DelinerDefaultConfig, FileNestingDefaultConfig, HighlightDefaultConfig, PackagerDefaultConfig } from '../constants/config'
import { configs } from '../constants/config'

/**
 * get user defined "veco.highlight" extension config (with default values)
 */
export function getHighlightConfig() {
  const config = vscode.workspace.getConfiguration(configs.highlight.root)
  const enabled = config.get(configs.highlight.enabled) as boolean
  const toggleURI = config.get(configs.highlight.toggleURI) as boolean
  const isCaseSensitive = config.get(configs.highlight.isCaseSensitive) as boolean
  const maxFilesForSearch = config.get(configs.highlight.maxFilesForSearch) as number
  const keywords = config.get(configs.highlight.keywords) as HighlightDefaultConfig['keywords']
  const keywordsPattern = config.get(configs.highlight.keywordsPattern) as HighlightDefaultConfig['keywordsPattern']
  const defaultStyle = config.get(configs.highlight.defaultStyle) as HighlightDefaultConfig['defaultStyle']
  const include = config.get(configs.highlight.include) as string[]
  const exclude = config.get(configs.highlight.exclude) as string[]

  return {
    config,
    enabled,
    isCaseSensitive,
    keywords,
    keywordsPattern,
    defaultStyle,
    include,
    exclude,
    maxFilesForSearch,
    toggleURI,
  }
}

/**
 * get user defined "explorer.fileNesting" extension config
 */
export function getFileNestingConfig() {
  const config = vscode.workspace.getConfiguration(configs.fileNesting.root)
  const enabled = config.get(configs.fileNesting.enabled) as FileNestingDefaultConfig['enabled']
  const expand = config.get(configs.fileNesting.expand) as FileNestingDefaultConfig['expand']
  const patterns = config.get(configs.fileNesting.patterns) as FileNestingDefaultConfig['patterns']

  return {
    config,
    enabled,
    expand,
    patterns,
  }
}

/**
 * get user defined "veco.colorize" extension config
 */
export function getColorizeConfig() {
  const config = vscode.workspace.getConfiguration(configs.colorize.root)
  const enabled = config.get(configs.colorize.enabled) as ColorizeDefaultConfig['enabled']
  const namedColor = config.get(configs.colorize.namedColor) as ColorizeDefaultConfig['namedColor']
  const decorationType = config.get(configs.colorize.decorationType) as ColorizeDefaultConfig['decorationType']
  const include = config.get(configs.colorize.include) as ColorizeDefaultConfig['include']
  const exclude = config.get(configs.colorize.exclude) as ColorizeDefaultConfig['exclude']

  return {
    config,
    enabled,
    namedColor,
    decorationType,
    include,
    exclude,
  }
}

/**
 * get user defined "veco.packager" extension config
 */
export function getPackagerConfig() {
  const config = vscode.workspace.getConfiguration(configs.packager.root)
  const moduleTypes = config.get(configs.packager.moduleTypes) as PackagerDefaultConfig['moduleTypes']
  const versionTarget = config.get(configs.packager.versionTarget) as PackagerDefaultConfig['versionTarget']
  const exclude = config.get(configs.packager.exclude) as string[]

  return {
    config,
    moduleTypes,
    versionTarget,
    exclude,
  }
}

/**
 * get user defined "veco.deliner" extension config
 */
export function getDelinerConfig() {
  const config = vscode.workspace.getConfiguration(configs.deliner.root)
  const include = config.get(configs.deliner.include) as DelinerDefaultConfig['include']
  const exclude = config.get(configs.deliner.exclude) as DelinerDefaultConfig['exclude']

  return {
    config,
    include,
    exclude,
  }
}
