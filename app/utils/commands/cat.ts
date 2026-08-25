import { findFile } from './files'
import type { TerminalCommandHandler } from './types'
import { failure, success } from './types'

export const catCommand: TerminalCommandHandler = (args, context) => {
  if (!args[0]) return failure('cat: missing file operand')
  if (args.length > 1) return failure(`cat: extra operand '${args[1]}'`)
  const file = findFile(context, args[0])
  if (!file) return failure(`cat: ${args[0]}: No such file`)
  return {
    ...success(file.lines.map(text => ({ text }))),
    view: {
      kind: file.document.path.startsWith('/posts/')
        ? 'post'
        : file.document.path === '/about' ? 'about' : 'page',
      document: file.document,
    },
  }
}
