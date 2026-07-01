import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { transform } from 'esbuild';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const stylesPath = join(process.cwd(), 'docs', 'styles');

if (!existsSync(stylesPath)) {
  console.warn('Built styles directory not found; skipping CSS minification.');
  process.exit(0);
}

const cssFiles = (await readdir(stylesPath))
  .filter((file) => file.endsWith('.css'))
  .map((file) => join(stylesPath, file));

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
