import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { transform } from 'esbuild';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const stylesPath = join(process.cwd(), 'docs', 'styles');

if (!existsSync(stylesPath)) {
  console.warn('Built styles directory not found; skipping CSS minification.');
  process.exit(0);
}

async function findCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const cssFiles = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      cssFiles.push(...await findCssFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.css')) {
      cssFiles.push(entryPath);
    }
  }

  return cssFiles;
}

const cssFiles = await findCssFiles(stylesPath);

for (const cssPath of cssFiles) {
  const before = statSync(cssPath).size;
  const source = await readFile(cssPath, 'utf8');
  const result = await transform(source, {
    loader: 'css',
    minify: true,
  });

  await writeFile(cssPath, result.code);

  const after = statSync(cssPath).size;
  const saved = Math.max(0, before - after);
  console.log(`Minified ${cssPath}: ${before} -> ${after} bytes (${saved} saved)`);
}
