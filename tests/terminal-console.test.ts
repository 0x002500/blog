import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const componentSource = readFileSync(
  fileURLToPath(new URL('../app/components/TerminalConsole.vue', import.meta.url)),
  'utf8',
)

describe('terminal console initial focus', () => {
  it('focuses the command input without scrolling a directly opened article', () => {
    const mountedHook = componentSource.match(/onMounted\(\(\) => \{([\s\S]*?)\n\}\)/)?.[1]

    expect(mountedHook).toContain("inputElement.value?.focus({ preventScroll: true })")
  })
})
