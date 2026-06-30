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
deploy_branch="deploy-gh-pages-$(date '+%Y%m%d%H%M%S')"
git subtree split --prefix docs -b "$deploy_branch"
git push origin "$deploy_branch:gh-pages" --force
git branch -D "$deploy_branch"

echo "Done! Your site should be live at https://blog.danmarshall.dev shortly."
