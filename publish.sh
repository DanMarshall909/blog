#!/usr/bin/env bash

# Publish script for Unix shells
# Builds the site and pushes to GitHub Pages

set -euo pipefail

echo "Building site with Astro..."
npm run build

echo "Adding changes to git..."
git add . ':(exclude).astro/data-store.json'

status="$(git status --porcelain)"
if [[ -n "$status" ]]; then
  echo "Committing changes..."
  git commit -m "Publish updated site $(date '+%Y-%m-%d %H:%M:%S')"
else
  echo "No changes to commit."
fi

echo "Pushing main..."
git pull --rebase --autostash origin main
git push origin main

echo "Publishing docs/ to gh-pages..."
deploy_worktree="$(mktemp -d)"
git worktree add --detach "$deploy_worktree" origin/gh-pages
rm -rf "$deploy_worktree/docs"
mkdir -p "$deploy_worktree/docs"
cp -a docs/. "$deploy_worktree/docs/"
(
  cd "$deploy_worktree"
  git add -A docs
  if [[ -n "$(git status --porcelain)" ]]; then
    git commit -m "Deploy built site $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin HEAD:gh-pages --force
  else
    echo "No gh-pages changes to deploy."
  fi
)
git worktree remove "$deploy_worktree"

echo "Done! Your site should be live at https://blog.danmarshall.dev shortly."
