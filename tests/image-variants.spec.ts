import { test, expect } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DOCS = join(__dirname, '..', 'docs');

type PictureAsset = {
  pageUrl: string;
  pictureHtml: string;
  fallbackSrc: string;
  avifSrc: string;
  webpSrc: string;
};

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

function collectPictureAssets(): PictureAsset[] {
  const assets: PictureAsset[] = [];

  for (const htmlFile of walkHtml(DOCS)) {
    const html = readFileSync(htmlFile, 'utf8');
    const pageUrl = fileToUrl(htmlFile);
    const pictures = html.matchAll(/<picture\b[\s\S]*?<\/picture>/gi);

    for (const picture of pictures) {
      const pictureHtml = picture[0];
      const sourceTags = [...pictureHtml.matchAll(/<source\b[^>]*>/gi)].map((m) => m[0]);
      const imgTag = pictureHtml.match(/<img\b[^>]*>/i)?.[0];

      if (!imgTag || sourceTags.length === 0) continue;

      const avifSource = sourceTags.find((source) => attr(source, 'type') === 'image/avif');
      const webpSource = sourceTags.find((source) => attr(source, 'type') === 'image/webp');
      const fallbackSrc = attr(imgTag, 'src');
      const avifSrc = avifSource ? attr(avifSource, 'srcset') : undefined;
      const webpSrc = webpSource ? attr(webpSource, 'srcset') : undefined;

      expect(fallbackSrc, `${pageUrl} has a <picture> without an <img src>`).toBeTruthy();
      expect(avifSrc, `${pageUrl} picture for ${fallbackSrc} is missing image/avif source`).toBeTruthy();
      expect(webpSrc, `${pageUrl} picture for ${fallbackSrc} is missing image/webp source`).toBeTruthy();

      assets.push({
        pageUrl,
        pictureHtml,
        fallbackSrc: fallbackSrc!,
        avifSrc: avifSrc!,
        webpSrc: webpSrc!,
      });
    }
  }

  return assets;
}

test.describe('optimized image variants', () => {
  for (const [index, asset] of collectPictureAssets().entries()) {
    test(`${asset.pageUrl} picture ${index + 1} serves valid optimized variants for ${asset.fallbackSrc}`, () => {
      const fallbackFile = docsPath(asset.fallbackSrc);
      const avifFile = docsPath(asset.avifSrc);
      const webpFile = docsPath(asset.webpSrc);

      expect(existsSync(fallbackFile), `${asset.fallbackSrc} is missing from docs`).toBe(true);
      expect(existsSync(avifFile), `${asset.avifSrc} is missing from docs`).toBe(true);
      expect(existsSync(webpFile), `${asset.webpSrc} is missing from docs`).toBe(true);

      expect(fileKind(avifFile), `${asset.avifSrc} is not an AVIF file`).toBe('avif');
      expect(fileKind(webpFile), `${asset.webpSrc} is not a WebP file`).toBe('webp');
      expect(fileKind(fallbackFile), `${asset.fallbackSrc} must be a PNG or JPEG fallback`).toMatch(/^(png|jpeg)$/);

      const fallbackSize = statSync(fallbackFile).size;
      const avifSize = statSync(avifFile).size;
      const webpSize = statSync(webpFile).size;

      expect(avifSize, `${asset.avifSrc} should be smaller than ${asset.fallbackSrc}`).toBeLessThan(fallbackSize);
      expect(webpSize, `${asset.webpSrc} should be smaller than ${asset.fallbackSrc}`).toBeLessThan(fallbackSize);
    });
  }
});
