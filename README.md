# Technical Scratches Blog

Built with [Astro](https://astro.build), deployed via [GitHub Actions](.github/workflows/publish.yml) to GitHub Pages.

## Getting Started

```sh
npm install
npm run dev        # dev server on http://localhost:3000
npm run build      # static build output to docs/
npm run preview    # preview the production build
npm test           # run Chromium suite and WebKit portrait regression checks
npm run test:publish # fast publishing checks against disposable local Git remotes
npm run test:resume-webkit # check portrait geometry in Safari's browser engine
```

The test suite requires the Playwright Chromium and WebKit browsers and their
system dependencies (`npx playwright install --with-deps chromium webkit`). The
normal test command includes the WebKit portrait checks because Chromium alone
does not reproduce the percentage-height issue. Use `test:resume-webkit` for a
focused check after changing resume image sizing.

## Publishing

After reviewing and committing changes, fast-forward `main` to the reviewed
commit, then run `./publish.sh` from a clean working tree. Stop any local preview
using port 4321 first so the PDF generator can start its temporary server.

The publisher rebuilds and validates the site, pushes the reviewed source, and
deploys into `gh-pages:/docs`. It does not commit unfinished work, integrate
unreviewed upstream changes, or force-push. If another deployment wins the race,
the push fails safely; inspect the current remote before retrying. The automatic
GitHub Actions publisher also preserves deployment history.

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
heroImage: /articles/<slug>/<image.ext>
description: "A meaningful meta description, ideally 120-160 characters."
---
```

See existing articles for examples. The site rebuilds automatically when pushed to `main` via GitHub Actions.
