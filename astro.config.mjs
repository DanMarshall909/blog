import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const MIME = {
  '.pdf': 'application/pdf',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

export default defineConfig({
  site: 'https://blog.danmarshall.dev',
  outDir: './docs',
  build: {
    assets: '_astro',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  vite: {
    plugins: [
      {
        name: 'serve-docs-assets',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url?.split('?')[0] ?? '';
            const ext = extname(url);
            if (!ext || !MIME[ext]) return next();
            const filePath = join(process.cwd(), 'docs', url);
            if (!existsSync(filePath)) return next();
            const content = readFileSync(filePath);
            res.setHeader('Content-Type', MIME[ext]);
            res.end(content);
          });
        },
      },
    ],
  },
});
