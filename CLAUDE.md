# CLAUDE.md — blog.danmarshall.dev

## Stack

- **Static site generator**: Wintersmith 2.5.0
- **Templates**: Pug (`templates/`)
- **Content**: Markdown (`contents/articles/`)
- **CSS**: Single file (`contents/css/main.css`) with CSS custom properties and `oklch()` colour tokens
- **Syntax highlighting**: highlight.js 11.x via CDN (client-side only)
- **Build output**: `docs/` (served by GitHub Pages)
- **Deployment**: GitHub Pages from `gh-pages` branch, `/docs` folder

## Commands

```bash
# Build
npm run build

# Preview server (port 3000)
./node_modules/.bin/wintersmith preview --port 3000

# Publish (build + commit + push main + sync gh-pages)
powershell -ExecutionPolicy Bypass -File publish.ps1
```

## Deployment

GitHub Pages serves from the **`gh-pages` branch**, `/docs` folder at `blog.danmarshall.dev`.

`publish.ps1` handles everything: build → commit → push `main` → force-push `main` to `gh-pages`.

Never push to `gh-pages` manually — always go through `publish.ps1` or `git push origin main:gh-pages --force`.

## Article format

Articles live at `contents/articles/<slug>/index.md`.

Required frontmatter:

```yaml
---
title: "Article Title"
author: Dan Marshall
date: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
template: article.pug
heroImage: /articles/<slug>/<image.ext>   # optional
---
```

Rules:
- `title` must be a quoted string
- `date` must be `"YYYY-MM-DD"` format
- `tags` must be a JSON array
- `template` is always `article.pug`
- Use `##` for top-level sections, `###` for subsections — never `#` in the body
- Code fences must use a language tag — never `powershell` (not in the highlight.js CDN build); use `bash` instead
- Em dashes (—) not double hyphens (--)

## Skills

- `/new-article` — guided workflow to create, format, proofread, and publish a new article

## CSS conventions

- Theming via `data-theme="dark"` on `<html>` — default is **dark**
- Colour tokens defined as CSS custom properties at `:root` and `[data-theme="dark"]`
- `oklch()` relative colour syntax used for gradient and derived colours
- Breakpoint: `@media (max-width: 900px)` for mobile
- Desktop TOC: sticky sidebar via `.article-with-toc` flex layout
- Mobile TOC: injected into `.drawer-body` via JavaScript on DOMContentLoaded

## highlight.js notes

- Version 9 (via CDN) — EOL but functional
- Theme switches between `atom-one-light` / `atom-one-dark` on toggle
- Re-highlighting on theme change: always `delete block.dataset.highlighted` before calling `hljs.highlightElement()`
- Do NOT call `hljs.highlightAll()` — `updateHljsTheme()` handles initial highlighting

## Stale branches (safe to delete)

- `claude/add-resume-blog-post-fX7AP` — merged
- `claude/remove-image-backgrounds-aQCi2` — superseded
- `fix-ui` — contains unpublished "Introducing Flo" article, keep until published
