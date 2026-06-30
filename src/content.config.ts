import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    author: z.string().default('Dan Marshall'),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    heroImagePosition: z.string().default('center'),
    heroImageScale: z.number().default(1),
    headerImagePosition: z.string().optional(),
    headerImageScale: z.number().optional(),
    cardImagePosition: z.string().default('center'),
    cardImageScale: z.number().default(1),
    description: z.string().min(70, 'description too short — Lighthouse requires a meaningful meta description (aim for 120-160 chars)'),
  }),
});

export const collections = { articles };
