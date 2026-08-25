import { defineNuxtModule } from 'nuxt/kit'

const MDC_PREFIX = '@nuxtjs/mdc > '
const CONTENT_PREFIX = '@nuxt/content > '

export function anchorMdcOptimizeDeps(include: string[]) {
  return include.map(entry => entry.startsWith(MDC_PREFIX) ? `${CONTENT_PREFIX}${entry}` : entry)
}

export default defineNuxtModule({
  meta: { name: 'fix-mdc-optimize-deps' },
  setup(_options, nuxt) {
    nuxt.hook('vite:extendConfig', (config) => {
      const include = config.optimizeDeps?.include
      if (include) config.optimizeDeps!.include = anchorMdcOptimizeDeps(include)
    })
  },
})
