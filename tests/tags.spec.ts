import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SANCTIONED_TAGS } from '../src/utils/tags';

const ARTICLES = join(__dirname, '..', 'src', 'content', 'articles');
const sanctioned = new Set<string>(SANCTIONED_TAGS);

function markdownFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...markdownFiles(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

function parseTags(markdown: string): string[] {
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const tagsLine = frontmatter.match(/^tags:\s*\[([^\]]*)\]/m)?.[1];
  if (!tagsLine) return [];

  return tagsLine
    .split(',')
    .map((tag) => tag.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

test.describe('article tags', () => {
  test('sanctioned tags are lowercase', () => {
    for (const tag of SANCTIONED_TAGS) {
      expect(tag, `sanctioned tag "${tag}" should be lowercase`).toBe(tag.toLowerCase());
    }
  });

  for (const file of markdownFiles(ARTICLES)) {
    test(`${relative(ARTICLES, file)} uses only sanctioned lowercase tags`, () => {
      const tags = parseTags(readFileSync(file, 'utf8'));
      expect(tags.length, `${file} should declare at least one tag`).toBeGreaterThan(0);

      for (const tag of tags) {
        expect(tag, `${file} tag "${tag}" should be lowercase`).toBe(tag.toLowerCase());
        expect(sanctioned.has(tag), `${file} tag "${tag}" is not sanctioned`).toBe(true);
      }
    });
  }
});
