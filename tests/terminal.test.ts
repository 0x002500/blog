import { describe, expect, it } from 'vitest'
import {
  TERMINAL_COMMANDS,
  completeInput,
  contentPathFromRoute,
  directoryEntries,
  historyAt,
  parseCommand,
  parseCommandLine,
  resolveDirectory,
  resolveFile,
  staticRouteHref,
} from '../app/utils/terminal'

const files = [
  '~/about/index.md',
  '~/contact/index.md',
  '~/guides/setup/windows.md',
  '~/posts/hello-terminal.md',
  '~/posts/nuxt-static-site.md',
]

describe('terminal filesystem', () => {
  it('parses commands and exposes the intended command set', () => {
    expect(parseCommand('  CD posts/  ')).toEqual({ raw: 'CD posts/', name: 'cd', args: ['posts/'] })
    expect(parseCommand(`cat 'posts/hello terminal.md'`)).toEqual({
      raw: `cat 'posts/hello terminal.md'`,
      name: 'cat',
      args: ['posts/hello terminal.md'],
    })
    expect(parseCommandLine('ls | cat file.md').commands.map(command => command.name)).toEqual(['ls', 'cat'])
    expect(TERMINAL_COMMANDS).toEqual(['help', 'pwd', 'ls', 'cd', 'cat', 'open', 'clear'])
  })

  it('moves through every directory represented by content files', () => {
    expect(resolveDirectory('~', 'posts/', files)).toBe('~/posts')
    expect(resolveDirectory('~/posts', '..', files)).toBe('~')
    expect(resolveDirectory('~', 'contact', files)).toBe('~/contact')
    expect(resolveDirectory('~/guides', 'setup', files)).toBe('~/guides/setup')
    expect(resolveDirectory('~', 'missing', files)).toBeUndefined()
  })

  it('lists only the current directory', () => {
    expect(directoryEntries('~', files)).toEqual(['about/', 'contact/', 'guides/', 'posts/'])
    expect(directoryEntries('~/contact', files)).toEqual(['index.md'])
    expect(directoryEntries('~/guides', files)).toEqual(['setup/'])
    expect(directoryEntries('~/posts', files)).toEqual(['hello-terminal.md', 'nuxt-static-site.md'])
  })

  it('resolves files relative to cwd and by root-relative path', () => {
    expect(resolveFile('~/posts', 'hello-terminal.md', files)).toBe('~/posts/hello-terminal.md')
    expect(resolveFile('~', 'posts/hello-terminal.md', files)).toBe('~/posts/hello-terminal.md')
    expect(resolveFile('~/contact', 'index.md', files)).toBe('~/contact/index.md')
    expect(resolveFile('~/guides', 'setup/windows.md', files)).toBe('~/guides/setup/windows.md')
    expect(resolveFile('~', 'hello-terminal.md', files)).toBeUndefined()
  })

  it('links to the concrete static directory instead of relying on redirects', () => {
    expect(staticRouteHref('/posts/hello-terminal')).toBe('/posts/hello-terminal/')
    expect(staticRouteHref('about/')).toBe('/about/')
    expect(contentPathFromRoute('/posts/hello-terminal/')).toBe('/posts/hello-terminal')
  })
})

describe('terminal keyboard behavior', () => {
  it('completes directories and files using cwd', () => {
    expect(completeInput('cd co', '~', files).value).toBe('cd contact/')
    expect(completeInput('cat hel', '~/posts', files).value).toBe('cat hello-terminal.md')
    expect(completeInput('open co', '~', files).value).toBe('open contact/index.md')
  })

  it('keeps ambiguous completion unchanged', () => {
    const result = completeInput('c', '~', files)
    expect(result.value).toBe('c')
    expect(result.matches).toEqual(['cd', 'cat', 'clear'])
  })

  it('does not complete the removed grep command', () => {
    expect(completeInput('gr', '~', files)).toEqual({ value: 'gr', matches: [] })
  })

  it('walks history up and down with a blank entry at the end', () => {
    const history = ['ls', 'cd posts', 'cat hello-terminal.md']
    expect(historyAt(history, 3, -1)).toEqual({ index: 2, value: 'cat hello-terminal.md' })
    expect(historyAt(history, 2, -1)).toEqual({ index: 1, value: 'cd posts' })
    expect(historyAt(history, 2, 1)).toEqual({ index: 3, value: '' })
  })
})
