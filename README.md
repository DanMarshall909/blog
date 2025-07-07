# Technical Scratches Blog

A static blog powered by [Wintersmith](https://github.com/jnordberg/wintersmith).

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Run the local preview server:**
   ```sh
   npx wintersmith preview
   ```
   Open [http://localhost:8080](http://localhost:8080) in your browser.

3. **Build the static site:**
   ```sh
   npx wintersmith build
   ```
   The output will be in the `docs/` folder (ready for GitHub Pages).

## Publishing to GitHub Pages

1. Commit and push your changes to the `main` branch (or `master` if that's your default):
   ```sh
   git add .
   git commit -m "Update site content"
   git push origin main
   ```

2. Ensure your repository is configured to serve from the `docs/` folder in the GitHub Pages settings.

Your site will be published at `https://<your-username>.github.io/<your-repo>/`.

---

**Add new articles** to `contents/articles/<your-article>/index.md` with appropriate front-matter (see existing articles for examples).
