import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  assertUniqueContentRoutes,
  assertValidPostDates,
  assertValidPostFileNames,
  contentFilePathToRoute,
  findContentMarkdownFiles,
} from './shared/content.ts'

const contentDirectory = fileURLToPath(new URL('./content', import.meta.url))
const contentFiles = findContentMarkdownFiles(contentDirectory)
const postFiles = contentFiles
  .filter(file => /^posts\/[^/]+\.md$/.test(file))
  .map(file => file.slice('posts/'.length))

assertValidPostFileNames(postFiles)
assertValidPostDates(contentFiles
  .filter(file => file.startsWith('posts/'))
  .map(file => ({ file, source: readFileSync(join(contentDirectory, file), 'utf8') })))
assertUniqueContentRoutes(contentFiles)

const productionSiteUrl = process.env.NUXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

if (process.env.NODE_ENV === 'production' && !productionSiteUrl) {
  throw new Error('生产构建必须设置 NUXT_PUBLIC_SITE_URL，例如 https://blog.example.com')
}

if (productionSiteUrl && !/^https?:\/\//.test(productionSiteUrl)) {
  throw new Error('NUXT_PUBLIC_SITE_URL 必须是完整的 http(s) URL')
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxt/content', './modules/fix-mdc-optimize-deps'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      siteUrl: productionSiteUrl || 'http://localhost:3000',
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: [
        '/',
        ...contentFiles.map(contentFilePathToRoute),
      ],
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { name: 'color-scheme', content: 'dark' },
        { name: 'theme-color', content: '#0c0c0c' },
      ],
    },
  },
})
