import { test, expect } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DOCS = join(__dirname, '..', 'docs');

function walkHtml(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function fileToUrl(file: string): string {
  const rel = relative(DOCS, file).replaceAll(sep, '/');
  return '/' + rel.replace(/index\.html$/, '');
}

function attr(html: string, name: string): string | undefined {
  const match = html.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'));
  return match?.[1];
}

function docsPath(src: string): string {
  expect(src, `image src must be root-relative: ${src}`).toMatch(/^\//);
  return join(DOCS, src.slice(1));
}

function fileKind(file: string): 'avif' | 'webp' | 'png' | 'jpeg' | 'unknown' {
  const bytes = readFileSync(file).subarray(0, 16);
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (bytes.subarray(4, 8).toString('ascii') === 'ftyp') return 'avif';
  return 'unknown';
}

function parseSrcset(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean);
}

type PictureVariant = {
  pageUrl: string;
  fallbackSrc: string;
  variantUrls: { url: string; kind: 'avif' | 'webp' }[];
};

function collectVariants(): PictureVariant[] {
  const variants: PictureVariant[] = [];

  for (const htmlFile of walkHtml(DOCS)) {
    const html = readFileSync(htmlFile, 'utf8');
    const pageUrl = fileToUrl(htmlFile);
    const pictures = html.matchAll(/<picture\b[\s\S]*?<\/picture>/gi);

    for (const picture of pictures) {
      const pictureHtml = picture[0];
      const sourceTags = [...pictureHtml.matchAll(/<source\b[^>]*>/gi)].map((m) => m[0]);
      const imgTag = pictureHtml.match(/<img\b[^>]*>/i)?.[0];

      if (!imgTag || sourceTags.length === 0) continue;

      const fallbackSrc = attr(imgTag, 'src');
      expect(fallbackSrc, `${pageUrl} has a <picture> without an <img src>`).toBeTruthy();

      const avifSource = sourceTags.find((source) => attr(source, 'type') === 'image/avif');
      const webpSource = sourceTags.find((source) => attr(source, 'type') === 'image/webp');
      const avifSrcset = avifSource ? attr(avifSource, 'srcset') : undefined;
      const webpSrcset = webpSource ? attr(webpSource, 'srcset') : undefined;
      const fallbackSrcset = attr(imgTag, 'srcset');

      const avifUrls = avifSrcset ? parseSrcset(avifSrcset) : [];
      const webpUrls = webpSrcset ? parseSrcset(webpSrcset) : [];
      const fallbackUrls = fallbackSrcset ? parseSrcset(fallbackSrcset) : [];

      expect(avifUrls.length, `${pageUrl} picture for ${fallbackSrc} is missing image/avif source`).toBeGreaterThan(0);
      expect(webpUrls.length, `${pageUrl} picture for ${fallbackSrc} is missing image/webp source`).toBeGreaterThan(0);

      const variantUrls: PictureVariant['variantUrls'] = [
        ...avifUrls.map((url) => ({ url, kind: 'avif' as const })),
        ...webpUrls.map((url) => ({ url, kind: 'webp' as const })),
        ...fallbackUrls.map((url) => ({ url, kind: 'png' as const })),
      ];

      variants.push({ pageUrl, fallbackSrc: fallbackSrc!, variantUrls });
    }
  }

  return variants;
}

test.describe('optimized image variants', () => {
  for (const variant of collectVariants()) {
    test(`${variant.pageUrl} all optimized variants exist and are valid for ${variant.fallbackSrc}`, () => {
      const fallbackFile = docsPath(variant.fallbackSrc);
      const fallbackSize = statSync(fallbackFile).size;
      expect(fileKind(fallbackFile), `${variant.fallbackSrc} must be a PNG or JPEG fallback`).toMatch(/^(png|jpeg)$/);

      for (const { url, kind } of variant.variantUrls) {
        const file = docsPath(url);
        expect(existsSync(file), `${url} is missing from docs`).toBe(true);
        expect(fileKind(file), `${url} is not a ${kind.toUpperCase()} file`).toBe(kind);

        if (kind !== 'png' && kind !== 'jpeg') {
          const size = statSync(file).size;
          expect(size, `${url} (${size}B) should be smaller than fallback ${variant.fallbackSrc} (${fallbackSize}B)`).toBeLessThan(fallbackSize);
        }
      }
    });
  }
});
