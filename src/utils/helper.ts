import vscode from 'vscode'
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
