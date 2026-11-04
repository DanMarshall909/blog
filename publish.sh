#!/usr/bin/env bash

# Publish script for Unix shells
# Builds the site and pushes to GitHub Pages

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Publish from a clean main branch after review." >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Publishing requires a clean working tree; commit and review changes first." >&2
  exit 1
fi
git fetch origin main gh-pages
if ! git merge-base --is-ancestor origin/main HEAD; then
  echo "Publishing stopped: upstream main has unreviewed changes." >&2
  exit 1
fi
source_commit="$(git rev-parse HEAD)"

echo "Building site with Astro..."
npm run build

if [[ "$(git branch --show-current)" != "main" || "$(git rev-parse HEAD)" != "$source_commit" || -n "$(git status --porcelain)" ]]; then
  echo "Source changed during build; review it before publishing." >&2
  exit 1
fi
for artifact in index.html CNAME .nojekyll articles/resume/index.html articles/resume/article.pdf articles/resume-brief/index.html articles/resume-brief/article.pdf; do
  if [[ ! -f "docs/$artifact" ]]; then
    echo "Missing build artifact: docs/$artifact" >&2
    exit 1
  fi
done
if [[ "$(<docs/CNAME)" != "blog.danmarshall.dev" ]]; then
  echo "Unexpected CNAME; refusing to publish." >&2
  exit 1
fi
git fetch origin main
if ! git merge-base --is-ancestor origin/main "$source_commit"; then
  echo "Publishing stopped: upstream main has unreviewed changes." >&2
  exit 1
fi

echo "Pushing main..."
git push origin "$source_commit:main"

echo "Publishing docs/ to gh-pages..."
git fetch origin gh-pages
deploy_worktree="$(mktemp -d)"
cleanup() {
  if [[ -f "$deploy_worktree/.git" ]]; then
    git worktree remove "$deploy_worktree" || echo "Retained deployment worktree for inspection: $deploy_worktree" >&2
  else
    rmdir "$deploy_worktree"
  fi
}
trap cleanup EXIT
git worktree add --detach "$deploy_worktree" origin/gh-pages
rm -rf "$deploy_worktree/docs"
mkdir -p "$deploy_worktree/docs"
cp -a docs/. "$deploy_worktree/docs/"
(
  cd "$deploy_worktree"
  git add -f -A docs
  if [[ -n "$(git status --porcelain)" ]]; then
    git commit -m "Deploy built site $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin HEAD:gh-pages
  else
    echo "No gh-pages changes to deploy."
  fi
)
echo "Done! Your site should be live at https://blog.danmarshall.dev shortly."
