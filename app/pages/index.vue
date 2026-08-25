<script setup lang="ts">
const site = useAppConfig().site
const config = useRuntimeConfig()
const { data: documents } = await useAsyncData('content-all', () => queryCollection('content').all())
const { data: posts } = await useAsyncData('posts-index', () => queryCollection('content')
  .where('path', 'LIKE', '/posts/%')
  .where('date', 'IS NOT NULL')
  .order('date', 'DESC')
  .all())
const { data: about } = await useAsyncData('about-document', () => queryCollection('content')
  .path('/about')
  .first())

if (!about.value) {
  throw createError({ statusCode: 500, statusMessage: 'content/about/index.md is missing' })
}

const siteUrl = config.public.siteUrl.replace(/\/$/, '')

useSeoMeta({
  title: site.name,
  description: site.description,
  ogTitle: site.name,
  ogDescription: site.description,
  ogType: 'website',
  ogUrl: siteUrl,
  ogImage: `${siteUrl}/og.png`,
  twitterCard: 'summary_large_image',
  twitterImage: `${siteUrl}/og.png`,
})

useHead({
  link: [{ rel: 'canonical', href: siteUrl }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      description: site.description,
      url: siteUrl,
      author: { '@type': 'Person', name: site.author },
    }),
  }],
})
</script>

<template>
  <TerminalWindow>
    <TerminalConsole :posts="posts || []" :about="about!" :documents="documents || []" />
  </TerminalWindow>
</template>
