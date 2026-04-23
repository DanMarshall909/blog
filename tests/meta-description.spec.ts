import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DOCS = join(__dirname, '..', 'docs');

function findIndexHtml(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...findIndexHtml(full));
    else if (entry === 'index.html') out.push(full);
  }
  return out;
}

function fileToUrl(file: string): string {
  const rel = relative(DOCS, file).replaceAll(sep, '/');
  const path = rel.replace(/index\.html$/, '');
  return '/' + path;
}

const urls = findIndexHtml(DOCS).map(fileToUrl);

test.describe('Every built page has a meta description', () => {
  for (const url of urls) {
    test(`${url} has <meta name="description">`, async ({ request }) => {
      const res = await request.get(url);
      expect(res.status()).toBe(200);
      const html = await res.text();
      const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
      expect(match, `no <meta name="description"> found on ${url}`).not.toBeNull();
      const content = match![1].trim();
      expect(content.length, `meta description on ${url} is empty`).toBeGreaterThan(0);
    });
  }
});
