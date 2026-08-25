import { resolveDirectory } from '../terminal'
import type { TerminalCommandHandler } from './types'
import { failure, success } from './types'

export const cdCommand: TerminalCommandHandler = (args, context) => {
  if (args.length > 1) return failure('cd: too many arguments')
  const target = args[0]
  const nextDirectory = resolveDirectory(context.directory, target, context.files.map(file => file.path))
  if (!nextDirectory) return failure(`cd: ${target || ''}: No such file or directory`)
  return { ...success(), nextDirectory }
}
