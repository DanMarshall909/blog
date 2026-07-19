import { existsSync, mkdirSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const SITE_URL = 'http://127.0.0.1:4321';
const ARTICLES_SRC = resolve('src/content/articles');
const OUTPUT_DIR = resolve('docs');

async function getArticleSlugs() {
  const entries = await readdir(ARTICLES_SRC, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function startStaticServer() {
  const process = spawn(
    'python3',
    ['-m', 'http.server', '4321', '--bind', '127.0.0.1', '--directory', OUTPUT_DIR],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  process.stdout.on('data', data => process.stdout.write(data));
  process.stderr.on('data', data => process.stderr.write(data));

  return process;
}

async function waitForServer(process, timeoutMs = 30_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (process.exitCode !== null) {
      throw new Error(`Static server exited with code ${process.exitCode}`);
    }

    try {
      const response = await fetch(SITE_URL);
      if (response.ok) {
        return;
      }
    } catch {
      // The server is still starting.
    }

    await new Promise(resolvePromise => setTimeout(resolvePromise, 250));
  }

  throw new Error(`Static server timed out after ${timeoutMs / 1000} seconds`);
}

function renderPdf(url, outputPath) {
  return new Promise((resolvePromise, reject) => {
    const process = spawn('weasyprint', [url, outputPath], {
      stdio: 'inherit',
    });

    process.on('error', reject);
    process.on('exit', code => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`WeasyPrint exited with code ${code}`));
      }
    });
  });
}

async function generatePdfs() {
  console.log('Starting static site server...');
  const server = startStaticServer();

  try {
    await waitForServer(server);

    const slugs = await getArticleSlugs();
    console.log(`Found ${slugs.length} articles to generate PDFs for...`);

    const results = [];

    for (const slug of slugs) {
      const url = `${SITE_URL}/articles/${slug}/`;
      const outputDirectory = join(OUTPUT_DIR, 'articles', slug);
      const outputPath = join(outputDirectory, 'article.pdf');

      if (!existsSync(outputDirectory)) {
        mkdirSync(outputDirectory, { recursive: true });
      }

      try {
        await renderPdf(url, outputPath);
        const sizeKb = (statSync(outputPath).size / 1024).toFixed(1);
        console.log(`  ✓ ${slug} (${sizeKb} KB)`);
        results.push({ slug, success: true });
      } catch (error) {
        console.error(`  ✗ ${slug}: ${error.message}`);
        results.push({ slug, success: false, error: error.message });
      }
    }

    const succeeded = results.filter(result => result.success).length;
    const failed = results.length - succeeded;
    console.log(`\nDone — ${succeeded} succeeded, ${failed} failed`);

    if (failed > 0) {
      throw new Error('Some PDFs failed to generate');
    }
  } finally {
    server.kill('SIGTERM');
  }
}

generatePdfs().catch(error => {
  console.error(error.message);
  process.exit(1);
});
