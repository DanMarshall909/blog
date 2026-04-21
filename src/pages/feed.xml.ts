import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles');
  return rss({
    title: 'Technical Scratches',
    description: 'Thoughts on software engineering and life as a developer',
    site: context.site!,
    items: articles
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map(article => ({
        title: article.data.title,
        pubDate: article.data.date,
        link: `/articles/${article.id.replace(/\/index$/, '')}/`,
      })),
  });
}
