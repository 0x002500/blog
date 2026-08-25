import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

export const POST_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function contentFilePathToRoute(file: string) {
  const normalized = file.replace(/\\/g, '/').replace(/^\.?\/?content\//, '')
  if (!normalized.endsWith('.md')) {
    throw new Error(`内容文件必须是 Markdown：${file}`)
  }

  const segments = normalized
    .replace(/\.md$/, '')
    .split('/')
    .filter(Boolean)
    .map(segment => segment.replace(/^\d+\./, ''))

  if (segments.at(-1) === 'index') segments.pop()
  return segments.length ? `/${segments.join('/')}` : '/'
}

export function findContentMarkdownFiles(directory: string) {
  const files: string[] = []

  function visit(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolutePath = join(current, entry.name)
      if (entry.isDirectory()) visit(absolutePath)
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(relative(directory, absolutePath).replace(/\\/g, '/'))
      }
    }
  }

  visit(directory)
  return files.sort()
}

export function assertUniqueContentRoutes(files: string[]) {
  const routes = new Map<string, string>()

  for (const file of files) {
    const route = contentFilePathToRoute(file)
    const existing = routes.get(route)
    if (existing) {
      throw new Error(`内容路由重复：${existing} 和 ${file} 都对应 ${route}`)
    }
    routes.set(route, file)
  }
}

export function assertValidPostFileNames(files: string[]) {
  const slugs = new Set<string>()

  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    if (!POST_SLUG_PATTERN.test(slug)) {
      throw new Error(`文章文件名必须是小写 kebab-case：${file}`)
    }
    if (slugs.has(slug)) {
      throw new Error(`文章 slug 重复：${slug}`)
    }
    slugs.add(slug)
  }
}

export function assertValidPostDates(posts: Array<{ file: string, source: string }>) {
  for (const { file, source } of posts) {
    const date = source.match(/^date:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)?.[1]?.trim()
    if (!date) throw new Error(`文章必须包含 date：${file}`)
    if (!isValidIsoDate(date)) {
      throw new Error(`文章 date 必须是有效的 YYYY-MM-DD 日期：${file}`)
    }
  }
}

export function isValidIsoDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
}

export function sortNewestFirst<T extends { date: string }>(items: T[]) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date))
}
