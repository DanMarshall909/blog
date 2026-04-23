import { readdir, stat, access } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'articles');
const SOURCE_EXT = new Set(['.png', '.jpg', '.jpeg']);
const SKIP_DIRS = new Set(['variations']);

const AVIF_OPTS = { quality: 55, effort: 6 };
const WEBP_OPTS = { quality: 80, effort: 5 };

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else if (entry.isFile() && SOURCE_EXT.has(extname(entry.name).toLowerCase())) {
      yield full;
    }
  }
}

async function isUpToDate(src, out) {
  try {
    const [s, o] = await Promise.all([stat(src), stat(out)]);
    return o.mtimeMs >= s.mtimeMs;
  } catch {
    return false;
  }
}

async function convert(src, out, method) {
  if (await isUpToDate(src, out)) return { src, out, skipped: true };
  const pipeline = sharp(src);
  if (method === 'avif') pipeline.avif(AVIF_OPTS);
  else pipeline.webp(WEBP_OPTS);
  const info = await pipeline.toFile(out);
  const srcSize = (await stat(src)).size;
  return { src, out, skipped: false, srcSize, outSize: info.size };
}

const fmtKB = n => (n / 1024).toFixed(1).padStart(7) + ' KB';

let total = 0, saved = 0;
for await (const file of walk(ROOT)) {
  const base = file.slice(0, -extname(file).length);
  for (const fmt of ['avif', 'webp']) {
    const out = `${base}.${fmt}`;
    const r = await convert(file, out, fmt);
    if (r.skipped) {
      console.log(`skip   ${out}`);
    } else {
      const delta = r.srcSize - r.outSize;
      total += r.srcSize;
      saved += delta;
      console.log(`${fmt.padEnd(4)} ${fmtKB(r.srcSize)} → ${fmtKB(r.outSize)} (-${fmtKB(delta)})  ${out}`);
    }
  }
}
if (total) console.log(`\nTotal saved vs source: ${fmtKB(saved)} across ${fmtKB(total)} of inputs`);
