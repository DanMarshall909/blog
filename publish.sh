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

echo "Syncing gh-pages to main..."
git push origin main:gh-pages --force

echo "Done! Your site should be live at https://blog.danmarshall.dev shortly."
