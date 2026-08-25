<script setup lang="ts">
const route = useRoute()
const site = useAppConfig().site
const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl.replace(/\/$/, '')
const contentPath = contentPathFromRoute(route.path)
const isPost = contentPath.startsWith('/posts/')

const { data: document } = await useAsyncData(`content:${contentPath}`, () => queryCollection('content')
  .path(contentPath)
  .first())

if (!document.value) {
  throw createError({ statusCode: 404, statusMessage: '页面不存在' })
}

const { data: posts } = await useAsyncData('posts-all', () => queryCollection('content')
  .where('path', 'LIKE', '/posts/%')
  .where('date', 'IS NOT NULL')
  .order('date', 'DESC')
  .all())
const { data: documents } = await useAsyncData('content-all', () => queryCollection('content').all())
const { data: about } = await useAsyncData('about-document', () => queryCollection('content')
  .path('/about')
  .first())

if (!about.value) {
  throw createError({ statusCode: 500, statusMessage: 'content/about/index.md is missing' })
}

const canonicalUrl = `${siteUrl}${document.value.path}`
const imageUrl = document.value.image
  ? new URL(document.value.image, `${siteUrl}/`).toString()
  : undefined

useSeoMeta({
  title: document.value.title,
  description: document.value.description,
  ogTitle: document.value.title,
  ogDescription: document.value.description,
  ogType: isPost ? 'article' : 'website',
  ogUrl: canonicalUrl,
  ogImage: imageUrl,
  articlePublishedTime: isPost ? document.value.date : undefined,
  articleTag: isPost ? document.value.tags : undefined,
  twitterCard: imageUrl ? 'summary_large_image' : 'summary',
  twitterImage: imageUrl,
})

const structuredData: Record<string, unknown> = isPost
  ? {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: document.value.title,
      description: document.value.description,
      datePublished: document.value.date,
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
      author: { '@type': 'Person', name: site.author },
      publisher: { '@type': 'Person', name: site.author },
      keywords: document.value.tags?.join(', '),
    }
  : {
      '@context': 'https://schema.org',
      '@type': contentPath === '/about' ? 'ProfilePage' : 'WebPage',
      name: document.value.title,
      description: document.value.description,
      url: canonicalUrl,
    }

if (imageUrl) structuredData.image = imageUrl
if (contentPath === '/about') {
  structuredData.mainEntity = { '@type': 'Person', name: site.author }
}

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(structuredData) }],
})
</script>

<template>
  <TerminalWindow>
    <TerminalConsole
      :posts="posts || []"
      :about="about!"
      :documents="documents || []"
      :initial-document="document!"
      :initial-directory="`~/${document!.stem.split('/').slice(0, -1).join('/')}`.replace(/\/$/, '')"
      :initial-screen="isPost ? 'post' : 'page'"
    />
  </TerminalWindow>
</template>
