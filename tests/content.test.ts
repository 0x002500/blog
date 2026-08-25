import { describe, expect, it } from 'vitest'
import {
  assertUniqueContentRoutes,
  assertValidPostDates,
  assertValidPostFileNames,
  contentFilePathToRoute,
  isValidIsoDate,
  sortNewestFirst,
} from '../shared/content'

describe('post conventions', () => {
  it('accepts lowercase kebab-case Markdown filenames', () => {
    expect(() => assertValidPostFileNames(['hello-world.md', 'nuxt-4.md'])).not.toThrow()
  })

  it('rejects unsafe or ambiguous slugs', () => {
    expect(() => assertValidPostFileNames(['Hello World.md'])).toThrow(/kebab-case/)
    expect(() => assertValidPostFileNames(['hello_world.md'])).toThrow(/kebab-case/)
  })

  it('maps Markdown files to filesystem-based content routes', () => {
    expect(contentFilePathToRoute('posts/hello-world.md')).toBe('/posts/hello-world')
    expect(contentFilePathToRoute('about/index.md')).toBe('/about')
    expect(contentFilePathToRoute('contact/index.md')).toBe('/contact')
    expect(contentFilePathToRoute('guides/setup/windows.md')).toBe('/guides/setup/windows')
    expect(contentFilePathToRoute('index.md')).toBe('/')
  })

  it('rejects files that resolve to the same route', () => {
    expect(() => assertUniqueContentRoutes(['about.md', 'about/index.md']))
      .toThrow(/内容路由重复/)
  })

  it('validates real ISO calendar dates', () => {
    expect(isValidIsoDate('2026-08-24')).toBe(true)
    expect(isValidIsoDate('2026-02-30')).toBe(false)
    expect(isValidIsoDate('24-08-2026')).toBe(false)
  })

  it('requires valid dates for every post', () => {
    expect(() => assertValidPostDates([{ file: 'posts/hello.md', source: "---\ndate: '2026-08-24'\n---" }]))
      .not.toThrow()
    expect(() => assertValidPostDates([{ file: 'posts/missing.md', source: '---\ntitle: Missing\n---' }]))
      .toThrow(/必须包含 date/)
    expect(() => assertValidPostDates([{ file: 'posts/invalid.md', source: '---\ndate: 2026-02-30\n---' }]))
      .toThrow(/有效的 YYYY-MM-DD/)
  })

  it('sorts posts newest first without mutating the source', () => {
    const posts = [{ date: '2025-01-01' }, { date: '2026-08-24' }]
    expect(sortNewestFirst(posts).map(post => post.date)).toEqual(['2026-08-24', '2025-01-01'])
    expect(posts[0]?.date).toBe('2025-01-01')
  })
})
