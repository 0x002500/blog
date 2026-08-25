import type { TerminalDirectory } from '../terminal'

export interface TerminalDocument {
  path: string
  stem: string
  title: string
  description: string
  date?: string
  tags?: string[]
  body?: unknown
}

export interface VirtualFile {
  path: string
  lines: string[]
  document: TerminalDocument
}

export interface TerminalLine {
  text: string
  entry?: string
}

export interface TerminalView {
  kind: 'post' | 'about' | 'page'
  document: TerminalDocument
}

export interface TerminalCommandContext {
  directory: TerminalDirectory
  files: VirtualFile[]
  stdin?: TerminalLine[]
}

export interface TerminalCommandResult {
  stdout: TerminalLine[]
  stderr: string[]
  exitCode: 0 | 1 | 2
  layout?: 'horizontal'
  nextDirectory?: TerminalDirectory
  navigation?: string
  clear?: boolean
  view?: TerminalView
}

export type TerminalCommandHandler = (
  args: string[],
  context: TerminalCommandContext,
) => TerminalCommandResult

export function success(stdout: TerminalLine[] = []): TerminalCommandResult {
  return { stdout, stderr: [], exitCode: 0 }
}

export function failure(message: string): TerminalCommandResult {
  return { stdout: [], stderr: [message], exitCode: 2 }
}
