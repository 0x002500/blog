import { directoryEntries } from '../terminal'
import type { TerminalCommandHandler } from './types'
import { failure, success } from './types'

export const lsCommand: TerminalCommandHandler = (args, context) => {
  if (args.length) return failure(`ls: unsupported operand '${args[0]}'`)
  return {
    ...success(directoryEntries(context.directory, context.files.map(file => file.path))
      .map(entry => ({ text: entry, entry }))),
    layout: 'horizontal',
  }
}
