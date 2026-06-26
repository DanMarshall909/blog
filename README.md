# Technical Scratches Blog

Built with [Astro](https://astro.build), deployed via [GitHub Actions](.github/workflows/publish.yml) to GitHub Pages.

## Getting Started

```sh
npm install
npm run dev        # dev server on http://localhost:3000
npm run build      # static build output to docs/
npm run preview    # preview the production build
npm test           # run Playwright tests
```

## Project structure

```
src/
├── components/     # Astro components (ArticleCard, Picture, etc.)
├── content/
│   └── articles/   # Blog posts as <slug>/index.md
├── layouts/        # Page layouts
├── pages/          # Route pages (index, archive, topics, tags, articles)
└── utils/          # Shared utilities (tag helpers, etc.)
public/
└── styles/         # main.css — all styling with CSS custom properties
```

## Adding an article

Create `src/content/articles/<slug>/index.md` with frontmatter:

```yaml
---
title: "Article Title"
author: Dan Marshall
date: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
template: article.pug
heroImage: /articles/<slug>/<image.ext>
---
```

See existing articles for examples. The site rebuilds automatically when pushed to `main` via GitHub Actions.
