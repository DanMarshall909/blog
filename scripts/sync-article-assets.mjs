import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_ARTICLES_DIR = join(ROOT_DIR, 'src', 'content', 'articles');
const PUBLIC_ARTICLES_DIR = join(ROOT_DIR, 'public', 'articles');
const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

async function* findImages(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const sourcePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      yield* findImages(sourcePath);
      continue;
    }

    if (entry.isFile() && IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      yield sourcePath;
    }
  }
}

async function isCurrent(sourcePath, targetPath) {
  try {
    const [sourceStats, targetStats] = await Promise.all([
      stat(sourcePath),
      stat(targetPath),
    ]);

    return targetStats.mtimeMs >= sourceStats.mtimeMs && targetStats.size === sourceStats.size;
  } catch {
    return false;
  }
}

let copiedCount = 0;
let skippedCount = 0;

for await (const sourcePath of findImages(CONTENT_ARTICLES_DIR)) {
  const relativePath = relative(CONTENT_ARTICLES_DIR, sourcePath);
  const targetPath = join(PUBLIC_ARTICLES_DIR, relativePath);

  if (await isCurrent(sourcePath, targetPath)) {
    skippedCount += 1;
    continue;
  }

  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
  copiedCount += 1;
  console.log(`copied ${relativePath}`);
}

console.log(`Article asset sync complete: ${copiedCount} copied, ${skippedCount} current`);