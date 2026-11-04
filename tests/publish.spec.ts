import { test as base, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

function git(cwd: string, ...args: string[]) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

type Sandbox = { root: string; repo: string; remote: string; rival: string; env: NodeJS.ProcessEnv };
const test = base.extend<{ sandbox: Sandbox }>({
  sandbox: async ({}, use) => {
    const root = mkdtempSync(join(tmpdir(), 'blog-publish-test-'));
    try {
      const remote = join(root, 'remote.git');
      const repo = join(root, 'source');
      const rival = join(root, 'rival');
      const bin = join(root, 'bin');
      for (const dir of [repo, rival, bin]) mkdirSync(dir);
      git(root, 'init', '--bare', '--initial-branch=main', remote);
      for (const dir of [repo, rival]) {
        git(dir, 'init', '--initial-branch=main');
        git(dir, 'config', 'user.name', 'Publish test');
        git(dir, 'config', 'user.email', 'publish@example.invalid');
        git(dir, 'remote', 'add', 'origin', remote);
      }
      copyFileSync(resolve('publish.sh'), join(repo, 'publish.sh'));
      writeFileSync(join(repo, '.gitignore'), 'docs/\n');
      writeFileSync(join(repo, 'source.txt'), 'reviewed source\n');
      git(repo, 'add', '.');
      git(repo, 'commit', '-m', 'Reviewed source');
      git(repo, 'push', '-u', 'origin', 'main');
      git(rival, 'checkout', '-b', 'gh-pages');
      writeFileSync(join(rival, 'keep.txt'), 'preserve deployment history\n');
      git(rival, 'add', '.');
      git(rival, 'commit', '-m', 'Previous deployment');
      git(rival, 'push', '-u', 'origin', 'gh-pages');
      git(repo, 'fetch', 'origin');
      writeFileSync(join(bin, 'npm'), `#!/usr/bin/env bash
set -eu
mkdir -p docs/articles/{resume,resume-brief}
printf 'new site' > docs/index.html
printf 'blog.danmarshall.dev\\n' > docs/CNAME
touch docs/.nojekyll
for slug in resume resume-brief; do
  printf 'new resume' > "docs/articles/$slug/index.html"
  printf 'new PDF' > "docs/articles/$slug/article.pdf"
done
if [[ -n "\${OMIT_PDF:-}" ]]; then rm docs/articles/resume-brief/article.pdf; fi
if [[ -n "\${CHANGE_SOURCE:-}" ]]; then printf 'unreviewed' >> source.txt; fi
if [[ -n "\${WRONG_DOMAIN:-}" ]]; then printf 'wrong.example' > docs/CNAME; fi
`, { mode: 0o755 });
      await use({ root, repo, remote, rival, env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TMPDIR: root } });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
});

function publish(sandbox: Sandbox, extraEnv: NodeJS.ProcessEnv = {}) {
  const result = spawnSync('bash', ['publish.sh'], {
    cwd: sandbox.repo, env: { ...sandbox.env, ...extraEnv }, encoding: 'utf8', timeout: 10_000,
  });
  return { status: result.status, output: result.stdout + result.stderr };
}

for (const [env, diagnostic] of [
  ['OMIT_PDF', 'Missing build artifact'],
  ['WRONG_DOMAIN', 'Unexpected CNAME'],
  ['CHANGE_SOURCE', 'Source changed during build'],
]) {
  test(`publishing rejects ${env} before either remote changes`, async ({ sandbox }) => {
    const before = git(sandbox.remote, 'show-ref');
    const result = publish(sandbox, { [env]: '1' });
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain(diagnostic);
    expect(git(sandbox.remote, 'show-ref')).toBe(before);
  });
}

test('publishing refuses to integrate unreviewed upstream source', async ({ sandbox }) => {
  git(sandbox.rival, 'fetch', 'origin', 'main');
  git(sandbox.rival, 'checkout', '-b', 'main', 'origin/main');
  writeFileSync(join(sandbox.rival, 'source.txt'), 'concurrent source');
  git(sandbox.rival, 'commit', '-am', 'Concurrent source update');
  git(sandbox.rival, 'push', 'origin', 'main');
  const before = git(sandbox.remote, 'show-ref');
  const source = git(sandbox.repo, 'rev-parse', 'HEAD');
  const result = publish(sandbox);
  expect(result.status, result.output).not.toBe(0);
  expect(result.output).toContain('upstream main has unreviewed changes');
  expect(git(sandbox.remote, 'show-ref')).toBe(before);
  expect(git(sandbox.repo, 'rev-parse', 'HEAD')).toBe(source);
});

for (const state of ['feature branch', 'dirty tree', 'untracked file']) {
  test(`publishing rejects ${state} without changing either remote branch`, async ({ sandbox }) => {
    const before = git(sandbox.remote, 'show-ref');
    if (state === 'feature branch') git(sandbox.repo, 'checkout', '-b', 'feature');
    else writeFileSync(join(sandbox.repo, state === 'dirty tree' ? 'source.txt' : 'notes.txt'), 'unfinished');
    const result = publish(sandbox);
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain(state === 'feature branch' ? 'clean main' : 'clean working tree');
    expect(git(sandbox.remote, 'show-ref')).toBe(before);
  });
}

test('publishing deploys the reviewed build under docs and preserves history', async ({ sandbox }) => {
  const previous = git(sandbox.remote, 'rev-parse', 'gh-pages');
  writeFileSync(join(sandbox.repo, 'source.txt'), 'new reviewed source');
  git(sandbox.repo, 'commit', '-am', 'Reviewed update');
  const source = git(sandbox.repo, 'rev-parse', 'HEAD');
  const result = publish(sandbox);
  expect(result.status, result.output).toBe(0);
  expect(git(sandbox.remote, 'rev-parse', 'main')).toBe(source);
  git(sandbox.remote, 'merge-base', '--is-ancestor', previous, 'gh-pages');
  expect(git(sandbox.remote, 'show', 'gh-pages:docs/index.html')).toBe('new site');
  expect(git(sandbox.remote, 'show', 'gh-pages:docs/CNAME')).toBe('blog.danmarshall.dev');
  expect(git(sandbox.remote, 'show', 'gh-pages:docs/articles/resume-brief/article.pdf')).toBe('new PDF');
  expect(git(sandbox.remote, 'show', 'gh-pages:keep.txt')).toBe('preserve deployment history');
  expect(git(sandbox.remote, 'ls-tree', '--name-only', 'gh-pages').split('\n')).not.toContain('index.html');
  expect(git(sandbox.repo, 'worktree', 'list', '--porcelain').match(/^worktree /gm)).toHaveLength(1);
});

test('publishing rejects a competing deployment without overwriting it or leaving a worktree', async ({ sandbox }) => {
  // A real second writer advances gh-pages after this publisher commits its snapshot.
  writeFileSync(join(sandbox.repo, '.git/hooks/post-commit'), `#!/usr/bin/env bash
set -eu
if [[ -z "$(git branch --show-current)" ]]; then
  unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_COMMON_DIR GIT_PREFIX
  printf 'concurrent deployment' > "$RIVAL_REPO/concurrent.txt"
  git -C "$RIVAL_REPO" add concurrent.txt
  git -C "$RIVAL_REPO" commit -m 'Concurrent deployment'
  git -C "$RIVAL_REPO" push origin gh-pages
fi
`, { mode: 0o755 });
  const result = publish(sandbox, { RIVAL_REPO: sandbox.rival });
  expect(result.status, result.output).not.toBe(0);
  expect(result.output).toContain('[rejected]');
  expect(git(sandbox.remote, 'rev-parse', 'gh-pages')).toBe(git(sandbox.rival, 'rev-parse', 'HEAD'));
  expect(git(sandbox.remote, 'show', 'gh-pages:concurrent.txt')).toBe('concurrent deployment');
  expect(git(sandbox.repo, 'worktree', 'list', '--porcelain').match(/^worktree /gm)).toHaveLength(1);
});

test('the automatic publisher also preserves deployment history', () => {
  // This action input selects ordinary rather than force pushes in actions-gh-pages v4.
  const workflow = readFileSync('.github/workflows/publish.yml', 'utf8');
  expect(workflow).toMatch(/^\s+force_orphan: false$/m);
});
