import process from 'node:process'
import vscode from 'vscode'
import { minimatch } from 'minimatch'
import type { CustomDiagnosticSeverity } from '../constants/config'

/**
 * simplify error handling when working with promises in asynchronous code
 */
export async function to<T>(promise: Thenable<T>) {
  try {
    const res = await promise
    return [res, null] as const
  }
  catch (error) {
    console.error(error)
    return [null, error] as const
  }
}

/**
 * map user defined diagnostic severity string to `vscode.DiagnosticSeverity`
 */
export async function diagnosticSeverityMapper(severity: CustomDiagnosticSeverity) {
  switch (severity) {
    case 'error':
      return vscode.DiagnosticSeverity.Error
    case 'warning':
      return vscode.DiagnosticSeverity.Warning
    case 'information':
      return vscode.DiagnosticSeverity.Information
    case 'hint':
      return vscode.DiagnosticSeverity.Hint
    default:
      return undefined
  }
}

/**
 * retrieve metadata about a file in the user workspace folder
 */
export async function getFileStat(fileName: string) {
  // Get the currently opened workspace folders
  const workspaceFolders = vscode.workspace.workspaceFolders

  if (!workspaceFolders)
    return null

  // NOTE: we only use the first item in the `workspaceFolders` array
  const filePathUri = vscode.Uri.joinPath(workspaceFolders[0].uri, fileName)

  // get the file stat metadata
  const [fileStat, err] = await to(vscode.workspace.fs.stat(filePathUri))

  if (err)
    return null

  return fileStat
}

/**
 * detect user package managers
 */
export async function detectPackageManager() {
  const bunLockFileStat = await getFileStat('bun.lockb')
  if (bunLockFileStat)
    return 'bun'

  const pnpmLockFileStat = await getFileStat('pnpm-lock.yaml')
  if (pnpmLockFileStat)
    return 'pnpm'

  const yarnLockFileStat = await getFileStat('yarn.lock')
  if (yarnLockFileStat)
    return 'yarn'

  return 'npm'
}

/**
 * generate random predefined emoji
 */
export function generateRandomEmoji() {
  const emojis = ['🐵', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐔', '🐧', '🐦', '🐤', '🦆', '🦢', '🦉', '🦚', '🦜', '🐍', '🐢', '🦎', '🐊', '🐅', '🐆', '🦓', '🦌', '🐃', '🐖', '🐏', '🐑', '🐐', '🦙', '🐕', '🦮', '🐕‍🦺', '🐩', '🐎', '🐖', '🦄', '🐘', '🦏', '🦛', '🐪', '🐫', '🦒', '🦘', '🦌', '🐃', '🐄', '🐂', '🐁', '🐀']
  const randomIndex = Math.floor(Math.random() * emojis.length)

  return emojis[randomIndex]
}

/**
 * get real filename based on the input absolute path
 *
 * @param filename e.g "/Users/rifandani/Desktop/dev/react/react-app/src/modules/home/components/HomeClock/useHomeClock.hook.ts"
 * @returns e.g "useHomeClock.hook.ts"
 */
export function getFilename(filename: string) {
  return filename.split('/').at(-1)
}

/**
 * get paths based on the input `include` / `exclude` pattern config
 */
export function getPaths(patterns: Array<string>) {
  return Array.isArray(patterns)
    ? `{${patterns.join(',')},` + `}`
    : (typeof patterns == 'string' ? patterns : '')
}

/**
 * checks if the filename matches with the `include` / `exclude` config using `minimatch`
 */
export function isFileNameOk({ filename, include, exclude }: { include: string[], exclude: string[], filename: string }) {
  const includePatterns = getPaths(include) || '{**/*}'
  const excludePatterns = getPaths(exclude)

  // converting glob expressions into JavaScript RegExp objects
  const includeMatch = minimatch(filename, includePatterns)
  const excludeMatch = minimatch(filename, excludePatterns)

  return includeMatch && !excludeMatch
}

/**
 * look behind assertions ("(?<!abc) & (?<=abc)") supported from ECMAScript 2018 and onwards.
 *
 * NOTE: using `node:process` to get nodejs version
 */
export function escapeRegExpGroups(str: string) {
  // native in node.js 9 and up.
  if (Number.parseFloat(process.version.replace('v', '')) > 9.0) {
    const grpPattern = /(?<!\\)(\()([^?]\w*(?:\\+\w)*)(\))?/g
    // make group non-capturing
    return str.replace(grpPattern, '$1?:$2$3')
  }
  else {
    return escapeRegExpGroupsLegacy(str)
  }
}

/**
 * remove any unsupported lookbehinds
 */
export function escapeRegExpGroupsLegacy(str: string) {
  // Make all groups non-capturing
  return str.replace(/\(\?<[=|!][^)]*\)/g, '').replace(/((?:[^\\]{1}|^)(?:(?:[\\]{2})+)?)(\((?!\?[:|=|!]))([^)]*)(\))/g, '$1$2?:$3$4')
}

/**
 * to escape special characters in the input string (str)
 * so that it can be safely used as a literal in a regular expression pattern
 * without causing unintended interpretations of the special characters.
 */
export function escapeRegExp(str: string) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

/**
 * Creates/reuse a Terminal with a backing shell process.
 * The cwd of the terminal will be the workspace directory if it exists.
 */
export function executeCommand({ cmd, createNew = true }: { cmd: string, createNew?: boolean }) {
  let terminal = vscode.window.activeTerminal
  if (createNew || !terminal)
    terminal = vscode.window.createTerminal()

  terminal.show()
  terminal.sendText(cmd)
}
