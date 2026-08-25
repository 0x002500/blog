import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import { isValidIsoDate } from './shared/content.ts'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: {
        include: '**/*.md',
        prefix: '/',
      },
      schema: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        date: z.string().refine(isValidIsoDate, 'date 必须是有效的 YYYY-MM-DD 日期').optional(),
        tags: z.array(z.string()).optional(),
        image: z.string().optional(),
      }),
    }),
  },
})
