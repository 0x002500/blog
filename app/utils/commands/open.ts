import { staticRouteHref } from '../terminal'
import { findFile } from './files'
import type { TerminalCommandHandler } from './types'
import { failure, success } from './types'

export const openCommand: TerminalCommandHandler = (args, context) => {
  if (!args[0]) return failure('open: missing file operand')
  if (args.length > 1) return failure(`open: extra operand '${args[1]}'`)
  const file = findFile(context, args[0])
  if (!file) return failure(`open: ${args[0]}: No such file`)
  return { ...success(), navigation: staticRouteHref(file.document.path) }
}
