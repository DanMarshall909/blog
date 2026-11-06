import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

async function discoveryFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return discoveryFiles(path);
    return /\.(html|xml)$/.test(entry.name) ? [path] : [];
  }));
  return groups.flat();
}

test('public pages and feeds do not disclose the unlisted client resume', async () => {
  const files = await discoveryFiles('docs');
  const publicFiles = files.filter((path) => !relative('docs', path).startsWith('articles/resume-evoke/'));
  expect(publicFiles.length).toBeGreaterThan(0);

  for (const path of publicFiles) {
    const html = await readFile(path, 'utf8');
    expect(html.includes('/articles/resume-evoke'), `${path} must not link to the client resume`).toBe(false);
    expect(html.includes('Evoke Interactive Resume'), `${path} must not list the client resume`).toBe(false);
  }

  for (const path of ['docs/index.html', 'docs/archive/index.html', 'docs/topics/index.html', 'docs/feed.xml']) {
    expect(await readFile(path, 'utf8'), path).toContain('/articles/selected-public-projects/');
  }
});

test('the unlisted resume requests no indexing while ordinary articles remain indexable', async ({ page }) => {
  await page.goto('/articles/resume-evoke/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow, noarchive');
  await expect(page.getByRole('heading', { name: 'Dan Marshall', exact: true })).toBeVisible();

  await page.goto('/articles/selected-public-projects/');
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
});
