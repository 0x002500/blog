import { describe, expect, it } from 'vitest'
import { runCommandLine } from '../app/utils/commands'
import type { TerminalCommandContext, TerminalDocument } from '../app/utils/commands/types'

const post: TerminalDocument = {
  path: '/posts/hello-terminal',
  stem: 'posts/hello-terminal',
  title: 'Hello Terminal',
  description: 'A Nuxt terminal article',
}

const about: TerminalDocument = {
  path: '/about',
  stem: 'about/index',
  title: 'About',
  description: 'About this site',
}

function context(directory: TerminalCommandContext['directory'] = '~'): TerminalCommandContext {
  return {
    directory,
    files: [
      {
        path: '~/posts/hello-terminal.md',
        document: post,
        lines: [
          'Nuxt powers this blog.',
          'nuxt can be lowercase.',
          'a+b is literal.',
          'aaab is repeated.',
          '-draft status',
          'terminal terminal-blog',
        ],
      },
      {
        path: '~/about/index.md',
        document: about,
        lines: ['About this terminal.'],
      },
      {
        path: '~/contact/index.md',
        document: {
          path: '/contact',
          stem: 'contact/index',
          title: 'Contact',
          description: 'Contact this site',
        },
        lines: ['Contact this terminal.'],
      },
    ],
  }
}

function output(command: string, cwd: TerminalCommandContext['directory'] = '~') {
  return runCommandLine(command, context(cwd))
}

describe('terminal command runner', () => {
  it('does not expose the removed grep command', () => {
    expect(output('grep posts').stderr[0]).toMatch(/command not found/)
    expect(output('help').stdout.some(line => line.text.includes('grep'))).toBe(false)
  })

  it('marks ls output for horizontal rendering', () => {
    const result = output('ls')
    expect(result.stdout.map(line => line.text)).toEqual(['about/', 'contact/', 'posts/'])
    expect(result.layout).toBe('horizontal')
  })

  it('runs every command through a separate handler contract', () => {
    expect(output('pwd').stdout[0]?.text).toBe('/home/visitor')
    expect(output('cd posts').nextDirectory).toBe('~/posts')
    expect(output('cat posts/hello-terminal.md').view?.kind).toBe('post')
    expect(output('cat contact/index.md').view?.kind).toBe('page')
    expect(output('open posts/hello-terminal.md').navigation).toBe('/posts/hello-terminal/')
    expect(output('clear').clear).toBe(true)
    expect(output('help').stdout.some(line => line.text.startsWith('cat '))).toBe(true)
  })
})
