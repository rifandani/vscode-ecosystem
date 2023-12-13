import type { RunOptions } from 'npm-check-updates'

export const defaultCheckRunOptions: RunOptions = {
  dep: ['prod', 'dev'], // only "dependencies" and "devDependencies"
  target: 'latest', // could be overridden with config properties
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
