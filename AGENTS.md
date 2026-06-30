# AGENTS.md — blog.danmarshall.dev

## Project Notes

- Astro static site.
- Articles live in `src/content/articles/<slug>/index.md`.
- Build with `npm run build`; output is written to `docs/`.
- Preview locally with `npm run preview` or `npm run dev`.

## GitHub Pages Deployment

- GitHub Pages is configured to serve the `gh-pages` branch from the `/docs` folder.
- Do not publish the built site to the root of `gh-pages`; that causes the live site and custom domain to return GitHub's generic 404.
- The published `gh-pages` branch must contain `docs/index.html`, `docs/CNAME`, `docs/.nojekyll`, and the rest of the built site under `docs/`.
- `docs/CNAME` must contain `blog.danmarshall.dev`.
- Use `./publish.sh` for publishing; it rebuilds the site, pushes `main`, and deploys `docs/` into `gh-pages:/docs`.

## Article Image Metadata

- `heroImagePosition` and `heroImageScale` control the article hero image.
- `headerImagePosition` and `headerImageScale` control the top page header background.
- `cardImagePosition` and `cardImageScale` control article card backgrounds.
- Keep these separate; a crop that looks good in the header may not look good in the article hero or cards.
