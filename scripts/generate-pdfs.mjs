import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { readdir, writeFile } from 'fs/promises';
import { resolve, join } from 'path';
import { spawn } from 'child_process';

const SITE_URL = 'http://localhost:4321';
const ARTICLES_SRC = resolve('src/content/articles');
const OUTPUT_DIR = resolve('docs');

async function getArticleSlugs() {
  const entries = await readdir(ARTICLES_SRC, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

function startPreview() {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn('npx', ['astro', 'preview'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        proc.kill();
        reject(new Error('Preview server timed out after 30s'));
      }
    }, 30_000);

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      if (!started && text.includes('Local')) {
        started = true;
        clearTimeout(timeout);
        // Give it a moment for the server to be fully ready
        setTimeout(() => resolvePromise(proc), 1000);
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      if (!started && text.includes('Local')) {
        started = true;
        clearTimeout(timeout);
        setTimeout(() => resolvePromise(proc), 1000);
      }
    });

    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`Preview server exited with code ${code}`));
      }
    });
  });
}

async function generatePdfs() {
  console.log('Starting preview server...');
  let server;
  try {
    server = await startPreview();
  } catch (err) {
    console.error('Failed to start preview server:', err.message);
    process.exit(1);
  }

  const slugs = await getArticleSlugs();
  console.log(`Found ${slugs.length} articles to generate PDFs for...`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });

  const results = [];
  for (const slug of slugs) {
    const url = `${SITE_URL}/articles/${slug}/`;
    const outDir = join(OUTPUT_DIR, 'articles', slug);
    const outPath = join(outDir, 'article.pdf');

    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

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

  await browser.close();

  if (server) {
    server.kill();
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`\nDone — ${succeeded} succeeded, ${failed} failed`);

  if (failed > 0) {
    console.error('Some PDFs failed to generate');
    process.exit(1);
  }
}

generatePdfs();
