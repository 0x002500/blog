import { TERMINAL_COMMANDS, closestMatch, parseCommandLine } from '../terminal'
import { catCommand } from './cat'
import { cdCommand } from './cd'
import { clearCommand } from './clear'
import { helpCommand } from './help'
import { lsCommand } from './ls'
import { openCommand } from './open'
import { pwdCommand } from './pwd'
import type { TerminalCommandContext, TerminalCommandHandler, TerminalCommandResult } from './types'
import { failure, success } from './types'

const handlers: Record<string, TerminalCommandHandler> = {
  help: helpCommand,
  pwd: pwdCommand,
  ls: lsCommand,
  cd: cdCommand,
  cat: catCommand,
  open: openCommand,
  clear: clearCommand,
}

function executeCommand(name: string, args: string[], context: TerminalCommandContext) {
  const handler = handlers[name]
  if (handler) return handler(args, context)
  const suggestion = closestMatch(name, [...TERMINAL_COMMANDS])
  return failure(`${name}: command not found${suggestion ? ` (did you mean ${suggestion}?)` : ''}`)
}

export function runCommandLine(raw: string, context: TerminalCommandContext): TerminalCommandResult {
  const parsed = parseCommandLine(raw)
  if (parsed.error) return failure(parsed.error)
  if (!parsed.commands.length) return success()

  let stdin = context.stdin
  let result = success()
  for (let index = 0; index < parsed.commands.length; index++) {
    const command = parsed.commands[index]!
    result = executeCommand(command.name, command.args, { ...context, stdin })
    const isLast = index === parsed.commands.length - 1
    if (!isLast && (result.nextDirectory || result.navigation || result.clear)) {
      return failure(`shell: ${command.name}: cannot be used before a pipe`)
    }
    if (!isLast && result.exitCode === 2) return result
    stdin = result.stdout
  }
  return result
}

export type {
  TerminalCommandContext,
  TerminalCommandResult,
  TerminalDocument,
  TerminalLine,
  VirtualFile,
} from './types'
