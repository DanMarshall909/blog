# CLAUDE.md — blog.danmarshall.dev

## Stack

- **Static site generator**: Astro
- **Layouts/pages**: Astro components in `src/layouts/`, `src/pages/`, and `src/components/`
- **Content**: Markdown content collection in `src/content/articles/`
- **CSS**: Single file (`public/styles/main.css`) with CSS custom properties and `oklch()` colour tokens
- **Syntax highlighting**: Astro/Shiki at build time
- **Build output**: `docs/` (served by GitHub Pages, gitignored — CI handles deployment)
- **CI/CD**: GitHub Actions (`.github/workflows/publish.yml`) builds and deploys to `gh-pages`
- **Deployment**: GitHub Pages from `gh-pages` branch, `/docs` folder

## Commands

```bash
# Build
npm run build

# Preview server
npm run preview
```

## Article format

Articles live at `src/content/articles/<slug>/index.md`.

Required frontmatter:

```yaml
---
title: "Article Title"
author: Dan Marshall
date: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
heroImage: /articles/<slug>/<image.ext>   # optional
description: "A meaningful meta description, ideally 120-160 characters."
---
```

Rules:
- `title` must be a quoted string
- `date` must be `"YYYY-MM-DD"` format
- `tags` must be a JSON array
- `description` is required and must be meaningful enough for Lighthouse
- Use `##` for top-level sections, `###` for subsections — never `#` in the body
- Code fences must use a language tag
- Em dashes (—) not double hyphens (--)

## CSS conventions

- Theming via `data-theme="dark"` on `<html>`
- Colour tokens defined as CSS custom properties at `:root` and `[data-theme="dark"]`
- `oklch()` relative colour syntax used for gradient and derived colours
- Breakpoint: `@media (max-width: 900px)` for mobile
- Desktop TOC and long-code disclosure are injected by inline layout JavaScript on article pages

## Stale branches (safe to delete)

- `claude/add-resume-blog-post-fX7AP` — merged
- `claude/remove-image-backgrounds-aQCi2` — superseded
- `fix-ui` — contains unpublished "Introducing Flo" article, keep until published
