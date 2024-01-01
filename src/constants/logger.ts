export const consoleLogRegex = /\bconsole\.log\s*\(/g
export const commentedConsoleLogRegex = /\/\/\s*console\.log\(/g
export const entireConsoleLogRegex = /\/\/\s*console\.log\s*\([^)]*\);?|\bconsole\.log\s*\([^)]*\);?/g // also catch the commented console.log or not

export const commandIds = {
  insert: 'veco.logger.insert',
  comment: 'veco.logger.comment',
  uncomment: 'veco.logger.uncomment',
  delete: 'veco.logger.delete',
} as const
