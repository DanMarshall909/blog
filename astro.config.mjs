import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blog.danmarshall.dev',
  outDir: './docs',
  build: {
    assets: '_astro',
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
});
