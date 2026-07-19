import { chromium } from 'playwright';
import { createReadStream, readFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'fs';
import { readdir } from 'fs/promises';
import { extname, resolve, join, normalize } from 'path';
import { createServer } from 'http';

const SITE_URL = 'http://localhost:4321';
const ARTICLES_SRC = resolve('src/content/articles');
const OUTPUT_DIR = resolve('docs');
const PREVIEW_TIMEOUT_MS = 30_000;
const NAVIGATION_TIMEOUT_MS = 45_000;
const PDF_SLUGS = new Set(['resume', 'resume-brief']);

async function getArticleSlugs() {
  const entries = await readdir(ARTICLES_SRC, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

async function cleanNonResumePdfs() {
  const articlesDir = join(OUTPUT_DIR, 'articles');
  const slugs = await getArticleSlugs();

  for (const slug of slugs) {
    if (PDF_SLUGS.has(slug)) continue;

    const pdfPath = join(articlesDir, slug, 'article.pdf');
    if (existsSync(pdfPath)) {
      unlinkSync(pdfPath);
    }
  }
}

function startPreview() {
  return new Promise((resolvePromise, reject) => {
    const mimeTypes = new Map([
      ['.html', 'text/html; charset=utf-8'],
      ['.css', 'text/css; charset=utf-8'],
      ['.js', 'text/javascript; charset=utf-8'],
      ['.mjs', 'text/javascript; charset=utf-8'],
      ['.json', 'application/json; charset=utf-8'],
      ['.svg', 'image/svg+xml'],
      ['.pdf', 'application/pdf'],
      ['.png', 'image/png'],
      ['.jpg', 'image/jpeg'],
      ['.jpeg', 'image/jpeg'],
      ['.webp', 'image/webp'],
      ['.avif', 'image/avif'],
      ['.ico', 'image/x-icon'],
      ['.woff', 'font/woff'],
      ['.woff2', 'font/woff2'],
      ['.ttf', 'font/ttf'],
    ]);

    const server = createServer((req, res) => {
      try {
        const requestUrl = new URL(req.url || '/', SITE_URL);
        const safePath = normalize(decodeURIComponent(requestUrl.pathname))
          .replace(/^[/\\]+/, '')
          .replace(/^(\.\.[/\\])+/, '');
        const basePath = join(OUTPUT_DIR, safePath);

        let filePath = basePath;
        let stat;

        try {
          stat = statSync(filePath);
          if (stat.isDirectory()) {
            filePath = join(filePath, 'index.html');
            stat = statSync(filePath);
          }
        } catch {
          if (!extname(filePath)) {
            filePath = join(basePath, 'index.html');
            stat = statSync(filePath);
          } else {
            throw new Error('Not found');
          }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', mimeTypes.get(extname(filePath)) || 'application/octet-stream');
        res.setHeader('Content-Length', stat.size);
        createReadStream(filePath).pipe(res);
      } catch {
        res.statusCode = 404;
        res.end('Not found');
      }
    });

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Preview server timed out after 30s'));
    }, PREVIEW_TIMEOUT_MS);

    server.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    server.listen(4321, '127.0.0.1', async () => {
      const startedAt = Date.now();
      while (Date.now() - startedAt < PREVIEW_TIMEOUT_MS) {
        try {
          const response = await fetch(SITE_URL, { method: 'GET' });
          if (response.ok) {
            clearTimeout(timeout);
            resolvePromise(server);
            return;
          }
        } catch {
          // Keep polling until the static server is reachable or we time out.
        }

        await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
      }

      clearTimeout(timeout);
      server.close();
      reject(new Error('Preview server timed out after 30s'));
    });
  });
}

async function generatePdfs() {
  console.log('Starting preview server...');
  let server;
  let browser;
  try {
    server = await startPreview();
  } catch (err) {
    console.error('Failed to start preview server:', err.message);
    process.exit(1);
  }

  const slugs = await getArticleSlugs();
  console.log(`Found ${slugs.length} articles, generating PDFs for ${PDF_SLUGS.size} resume article(s)...`);

  const results = [];

  try {
    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
    });
    context.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);
    context.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);

    for (const slug of slugs.filter((slug) => PDF_SLUGS.has(slug))) {
      const url = `${SITE_URL}/articles/${slug}/`;
      const outDir = join(OUTPUT_DIR, 'articles', slug);
      const outPath = join(outDir, 'article.pdf');

      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }

      try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });

        await page.evaluate(async () => {
          document.querySelectorAll('details').forEach((d) => { d.open = true; });
          document.querySelectorAll('pre.code-truncated').forEach((pre) => {
            pre.classList.remove('code-truncated');
            pre.classList.add('code-expanded');
          });

          if (document.fonts?.ready) {
            await document.fonts.ready;
          }

          await Promise.all(Array.from(document.images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolveImage) => {
              img.addEventListener('load', resolveImage, { once: true });
              img.addEventListener('error', resolveImage, { once: true });
            });
          }));
        });

        await page.pdf({
          path: outPath,
          format: 'A4',
          printBackground: true,
          margin: { top: '10mm', bottom: '10mm', left: '12mm', right: '12mm' },
        });

        const stats = readFileSync(outPath);
        const sizeKb = (stats.length / 1024).toFixed(1);
        console.log(`  ✓ ${slug} (${sizeKb} KB)`);
        results.push({ slug, success: true, path: outPath });
        await page.close();
      } catch (err) {
        console.error(`  ✗ ${slug}: ${err.message}`);
        results.push({ slug, success: false, error: err.message });
      }
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }

    if (server) {
      await new Promise((resolveClose) => server.close(resolveClose));
    }
  }

  await cleanNonResumePdfs();

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`\nDone — ${succeeded} succeeded, ${failed} failed`);

  if (failed > 0) {
    console.error('Some PDFs failed to generate');
    process.exit(1);
  }
}

generatePdfs();
