import { resolveFile } from '../terminal'
import type { TerminalCommandContext, VirtualFile } from './types'

export function findFile(context: TerminalCommandContext, target = ''): VirtualFile | undefined {
  const resolved = resolveFile(context.directory, target, context.files.map(file => file.path))
  if (!resolved) return undefined
  return context.files.find(file => file.path === resolved)
}
