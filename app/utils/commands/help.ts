import type { TerminalCommandHandler } from './types'
import { success } from './types'

export const helpCommand: TerminalCommandHandler = () => success([
  { text: 'help                         show commands' },
  { text: 'pwd                          print working directory' },
  { text: 'ls                           list current directory' },
  { text: 'cd <dir>                     change directory' },
  { text: 'cat <file>                   print a file' },
  { text: 'open <file>                  open its page' },
  { text: 'clear                        clear the screen' },
])
