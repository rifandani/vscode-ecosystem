import vscode from 'vscode'
import type { ColorizeDefaultConfig, FileNestingDefaultConfig, HighlightDefaultConfig, PackagerDefaultConfig } from '../constants/config'
import { colorizeDefaultConfig, configs, highlightDefaultConfig, packagerDefaultConfig } from '../constants/config'

/**
 * get user defined "veco.highlight" extension config (with default values)
 */
export function getHighlightConfig() {
  const config = vscode.workspace.getConfiguration(configs.highlight.root)
  const enabled = config.get<boolean>(configs.highlight.enabled, highlightDefaultConfig.enabled)
  const toggleURI = config.get<boolean>(configs.highlight.toggleURI, highlightDefaultConfig.toggleURI)
  const isCaseSensitive = config.get<boolean>(configs.highlight.isCaseSensitive, highlightDefaultConfig.isCaseSensitive)
  const enableDiagnostics = config.get<boolean>(configs.highlight.enableDiagnostics, highlightDefaultConfig.enableDiagnostics)
  const maxFilesForSearch = config.get(configs.highlight.maxFilesForSearch, highlightDefaultConfig.maxFilesForSearch)
  const keywords = config.get(configs.highlight.keywords, highlightDefaultConfig.keywords) as HighlightDefaultConfig['keywords']
  const keywordsPattern = config.get(configs.highlight.keywordsPattern, highlightDefaultConfig.keywordsPattern) as HighlightDefaultConfig['keywordsPattern']
  const defaultStyle = config.get(configs.highlight.defaultStyle, highlightDefaultConfig.defaultStyle) as HighlightDefaultConfig['defaultStyle']
  const include = config.get(configs.highlight.include, highlightDefaultConfig.include)
  const exclude = config.get(configs.highlight.exclude, highlightDefaultConfig.exclude)

  return {
    config,
    enabled,
    enableDiagnostics,
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
  const enabled = config.get<FileNestingDefaultConfig['enabled']>(configs.fileNesting.enabled)
  const expand = config.get<FileNestingDefaultConfig['expand']>(configs.fileNesting.expand) // this is not used in the codebase, maybe we can delete this
  const patterns = config.get<FileNestingDefaultConfig['patterns']>(configs.fileNesting.patterns) // this is not used in the codebase, maybe we can delete this

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
  const enabled = config.get<ColorizeDefaultConfig['enabled']>(configs.colorize.enabled)
  const namedColor = config.get<ColorizeDefaultConfig['namedColor']>(configs.colorize.namedColor)
  const decorationType = config.get<ColorizeDefaultConfig['decorationType']>(configs.colorize.decorationType)
  const include = config.get(configs.colorize.include, colorizeDefaultConfig.include)
  const exclude = config.get(configs.colorize.exclude, colorizeDefaultConfig.exclude)

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
  const moduleTypes = config.get<PackagerDefaultConfig['moduleTypes']>(configs.packager.moduleTypes, packagerDefaultConfig.moduleTypes)
  const versionTarget = config.get<PackagerDefaultConfig['versionTarget']>(configs.packager.versionTarget, packagerDefaultConfig.versionTarget)

  return {
    config,
    moduleTypes,
    versionTarget,
  }
}
