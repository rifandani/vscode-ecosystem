import type { RunOptions } from 'npm-check-updates'

export const defaultCheckRunOptions: RunOptions = {
  target: 'semver', // could be overridden with config properties
  install: 'never',
  dep: ['prod', 'dev'], // only "dependencies" and "devDependencies"
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
