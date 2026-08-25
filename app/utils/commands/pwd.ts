import type { TerminalCommandHandler } from './types'
import { failure, success } from './types'

export const pwdCommand: TerminalCommandHandler = (args, context) => {
  if (args.length) return failure(`pwd: extra operand '${args[0]}'`)
  const suffix = context.directory === '~' ? '' : context.directory.replace('~', '')
  return success([{ text: `/home/visitor${suffix}` }])
}
