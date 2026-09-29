import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { backCatalogue } from '../../lib/backCatalogue';

export const GET: APIRoute = async ({ site }) => {
  const { posts } = await backCatalogue();
  return rss({
    title: 'Inferogenesis writing',
    description: 'Technical posts on active inference and the software that runs it.',
    site: new URL('/writing/', site).href,
    items: posts.map((post) => ({
      title: post.title,
      description: post.summary,
      link: post.url,
      pubDate: new Date(post.published),
    })),
  });
};
