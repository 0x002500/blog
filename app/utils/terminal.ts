export const TERMINAL_COMMANDS = ['help', 'pwd', 'ls', 'cd', 'cat', 'open', 'clear'] as const

export type TerminalCommand = typeof TERMINAL_COMMANDS[number]
export type TerminalDirectory = string

export interface ParsedCommand {
  raw: string
  name: string
  args: string[]
}

export interface ParsedCommandLine {
  raw: string
  commands: ParsedCommand[]
  error?: string
}

export interface CompletionResult {
  value: string
  matches: string[]
}

export function parseCommand(raw: string): ParsedCommand {
  const parsed = parseCommandLine(raw)
  if (parsed.error || !parsed.commands[0]) {
    return { raw: raw.trim(), name: '', args: [] }
  }
  return { ...parsed.commands[0], raw: raw.trim() }
}

export function parseCommandLine(raw: string): ParsedCommandLine {
  const source = raw.trim()
  const stages: string[][] = [[]]
  let token = ''
  let tokenStarted = false
  let quote: 'single' | 'double' | undefined

  const pushToken = () => {
    if (!tokenStarted) return
    stages.at(-1)!.push(token)
    token = ''
    tokenStarted = false
  }

  for (let index = 0; index < source.length; index++) {
    const character = source[index]!

    if (character === "'" && quote !== 'double') {
      quote = quote === 'single' ? undefined : 'single'
      tokenStarted = true
      continue
    }

    if (character === '"' && quote !== 'single') {
      quote = quote === 'double' ? undefined : 'double'
      tokenStarted = true
      continue
    }

    if (character === '\\' && quote !== 'single') {
      const next = source[index + 1]
      if (next !== undefined) {
        token += next
        tokenStarted = true
        index++
        continue
      }
    }

    if (!quote && character === '|') {
      pushToken()
      if (!stages.at(-1)!.length) {
        return { raw: source, commands: [], error: 'shell: invalid null command' }
      }
      stages.push([])
      continue
    }

    if (!quote && /\s/.test(character)) {
      pushToken()
      continue
    }

    token += character
    tokenStarted = true
  }

  if (quote) return { raw: source, commands: [], error: 'shell: unmatched quote' }
  pushToken()
  if (stages.length > 1 && !stages.at(-1)!.length) {
    return { raw: source, commands: [], error: 'shell: invalid null command' }
  }

  return {
    raw: source,
    commands: stages
      .filter(parts => parts.length)
      .map(([name = '', ...args]) => ({ raw: [name, ...args].join(' '), name: name.toLowerCase(), args })),
  }
}

export function promptPath(directory: TerminalDirectory) {
  return directory
}

export function staticRouteHref(path: string) {
  const normalized = `/${path}`.replace(/\/{2,}/g, '/').replace(/\/$/, '')
  return normalized === '' ? '/' : `${normalized}/`
}

export function contentPathFromRoute(path: string) {
  const normalized = `/${path}`.replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  return normalized || '/'
}

function resolveVirtualPath(current: TerminalDirectory, target: string) {
  const value = target.trim().replace(/\\/g, '/')
  const absolute = value === '~' || value.startsWith('~/') || value.startsWith('/')
  const base = absolute ? [] : current.replace(/^~\/?/, '').split('/').filter(Boolean)
  const source = value.replace(/^~\/?/, '').replace(/^\/+/, '').split('/')

  for (const segment of source) {
    if (!segment || segment === '.') continue
    if (segment === '..') base.pop()
    else base.push(segment)
  }

  return base.length ? `~/${base.join('/')}` : '~'
}

export function resolveDirectory(
  current: TerminalDirectory,
  target = '~',
  filePaths: string[] = [],
): TerminalDirectory | undefined {
  const candidate = resolveVirtualPath(current, target || '~')
  if (candidate === '~') return candidate
  return filePaths.some(path => path.startsWith(`${candidate}/`)) ? candidate : undefined
}

export function resolveFile(current: TerminalDirectory, target: string, filePaths: string[]) {
  if (!target.trim()) return undefined
  const candidate = resolveVirtualPath(current, target)
  return filePaths.includes(candidate) ? candidate : undefined
}

export function directoryEntries(current: TerminalDirectory, filePaths: string[]) {
  const prefix = current === '~' ? '~/' : `${current}/`
  const entries = new Set<string>()

  for (const path of filePaths) {
    if (!path.startsWith(prefix)) continue
    const relative = path.slice(prefix.length)
    const [name] = relative.split('/')
    if (!name) continue
    entries.add(relative.includes('/') ? `${name}/` : name)
  }

  return [...entries].sort((a, b) => a.localeCompare(b))
}

function relativeFiles(current: TerminalDirectory, filePaths: string[]) {
  const prefix = current === '~' ? '~/' : `${current}/`
  return filePaths
    .filter(path => path.startsWith(prefix))
    .map(path => path.slice(prefix.length))
    .sort((a, b) => a.localeCompare(b))
}

function candidatesFor(input: string, current: TerminalDirectory, filePaths: string[]) {
  const hasTrailingSpace = /\s$/.test(input)
  const parts = input.trimStart().split(/\s+/)
  const command = parts[0]?.toLowerCase() || ''

  if (parts.length === 1 && !hasTrailingSpace) {
    return { prefix: '', query: command, candidates: [...TERMINAL_COMMANDS] }
  }

  const query = hasTrailingSpace ? '' : parts.at(-1) || ''
  const prefix = input.slice(0, input.length - query.length)

  if (command === 'cd') {
    const directories = directoryEntries(current, filePaths).filter(entry => entry.endsWith('/'))
    const candidates = current === '~' ? directories : ['../', '~/', ...directories]
    return { prefix, query, candidates }
  }

  if (command === 'cat' || command === 'open') {
    const candidates = relativeFiles(current, filePaths)
    return { prefix, query, candidates }
  }

  return { prefix, query, candidates: [] as string[] }
}

export function completeInput(input: string, current: TerminalDirectory, filePaths: string[]): CompletionResult {
  const { prefix, query, candidates } = candidatesFor(input, current, filePaths)
  const matches = candidates.filter(candidate => candidate.startsWith(query))
  if (matches.length === 1) return { value: `${prefix}${matches[0]}`, matches }
  return { value: input, matches }
}

export function historyAt(history: string[], index: number, direction: -1 | 1) {
  const nextIndex = Math.min(history.length, Math.max(0, index + direction))
  return {
    index: nextIndex,
    value: nextIndex === history.length ? '' : history[nextIndex] || '',
  }
}

export function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row])
  for (let column = 0; column <= a.length; column++) matrix[0]![column] = column

  for (let row = 1; row <= b.length; row++) {
    for (let column = 1; column <= a.length; column++) {
      matrix[row]![column] = b[row - 1] === a[column - 1]
        ? matrix[row - 1]![column - 1]!
        : Math.min(
            matrix[row - 1]![column - 1]! + 1,
            matrix[row]![column - 1]! + 1,
            matrix[row - 1]![column]! + 1,
          )
    }
  }
  return matrix[b.length]![a.length]!
}

export function closestMatch(value: string, candidates: string[]) {
  if (!value || !candidates.length) return undefined
  const best = candidates
    .map(candidate => ({ candidate, distance: levenshtein(value, candidate) }))
    .sort((a, b) => a.distance - b.distance)[0]
  return best && best.distance <= Math.max(2, Math.floor(value.length / 2)) ? best.candidate : undefined
}
