import { describe, expect, it } from 'vitest'
import { anchorMdcOptimizeDeps } from '../modules/fix-mdc-optimize-deps'

describe('Nuxt dependency optimization workaround', () => {
  it('anchors MDC nested dependencies through the direct content dependency', () => {
    expect(anchorMdcOptimizeDeps([
      '@nuxtjs/mdc > remark-gfm',
      '@nuxt/content > slugify',
    ])).toEqual([
      '@nuxt/content > @nuxtjs/mdc > remark-gfm',
      '@nuxt/content > slugify',
    ])
  })

  it('does not prefix an entry twice', () => {
    expect(anchorMdcOptimizeDeps([
      '@nuxt/content > @nuxtjs/mdc > remark-gfm',
    ])).toEqual([
      '@nuxt/content > @nuxtjs/mdc > remark-gfm',
    ])
  })
})
