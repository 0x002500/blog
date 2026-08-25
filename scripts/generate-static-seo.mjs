import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  assertUniqueContentRoutes,
  contentFilePathToRoute,
  findContentMarkdownFiles,
} from '../shared/content.ts'

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

if (!siteUrl || !/^https?:\/\//.test(siteUrl)) {
  throw new Error('NUXT_PUBLIC_SITE_URL must be a complete http(s) URL')
}

const contentDirectory = path.resolve('content')
const outputDirectory = path.resolve('.output/public')
const files = findContentMarkdownFiles(contentDirectory)

assertUniqueContentRoutes(files)

const contentUrls = await Promise.all(files.map(async (file) => {
  const source = await readFile(path.join(contentDirectory, file), 'utf8')
  const date = source.match(/^date:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)?.[1]?.trim()
  const route = contentFilePathToRoute(file)
  return { loc: route === '/' ? siteUrl : `${siteUrl}${route}`, lastmod: date }
}))

const escapeXml = value => value.replace(/[<>&'"]/g, character => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
}[character]))

const urls = [
  { loc: siteUrl },
  ...contentUrls.filter(({ loc }) => loc !== siteUrl),
].map(({ loc, lastmod }) => `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`)

await writeFile(
  path.join(outputDirectory, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
)

await writeFile(
  path.join(outputDirectory, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
)
