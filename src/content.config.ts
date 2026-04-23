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
    description: z.string().min(70, 'description too short — Lighthouse requires a meaningful meta description (aim for 120-160 chars)'),
    template: z.string().optional(), // ignored, kept for compatibility
  }),
});

export const collections = { articles };
