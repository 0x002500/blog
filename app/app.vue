<script setup lang="ts">
const site = useAppConfig().site

useHead({
  titleTemplate: title => !title || title === site.name ? site.name : `${title} · ${site.name}`,
  link: [{ rel: 'icon', href: '/favicon.ico' }],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>
