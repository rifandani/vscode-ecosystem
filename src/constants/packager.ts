import type { RunOptions } from 'npm-check-updates'
import { packagerDefaultConfig } from './config'

export const defaultCheckRunOptions: RunOptions = {
  dep: packagerDefaultConfig.moduleTypes,
  target: packagerDefaultConfig.versionTarget,
  install: 'never',
  concurrency: 16,
  cache: false, // do not use cache
  silent: true, // do not output anything on the console
  jsonUpgraded: true,
}

export const defaultUpdateRunOptions: RunOptions = {
  ...defaultCheckRunOptions,
  install: 'always',
  upgrade: true,
}
