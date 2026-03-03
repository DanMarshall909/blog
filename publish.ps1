# Publish script for Windows PowerShell
# Builds the site and pushes to GitHub

# Stop on error
$ErrorActionPreference = 'Stop'

Write-Host "Building site with Wintersmith..."
npx wintersmith build

Write-Host "Adding changes to git..."
git add .

Write-Host "Committing changes..."
git commit -m "Publish updated site $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "Pushing to GitHub..."
git push origin gh-pages

Write-Host "Done! Your site should be published via GitHub Pages."
