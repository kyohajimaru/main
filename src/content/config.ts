import { defineCollection, z } from 'astro:content';

const column = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    draft: z.boolean().default(true),
    slug: z.string().optional(),
  }),
});

export const collections = { column };
