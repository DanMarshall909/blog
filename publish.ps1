# Publish script for Windows PowerShell
# Builds the site and pushes to GitHub

# Stop on error
$ErrorActionPreference = 'Stop'

Write-Host "Building site with Astro..."
npm run build

Write-Host "Adding changes to git..."
git add .

$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..."
    git commit -m "Publish updated site $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} else {
    Write-Host "No changes to commit."
}

Write-Host "Pushing main..."
git pull --rebase origin main
git push origin main

Write-Host "Syncing gh-pages to main..."
git push origin main:gh-pages --force

Write-Host "Done! Your site should be live at https://blog.danmarshall.dev shortly."
