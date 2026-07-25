# Publish script for Windows PowerShell
# Builds the site and publishes it under gh-pages:/docs

$ErrorActionPreference = 'Stop'

Write-Host "Building site with Astro..."
npm run build

Write-Host "Adding changes to git..."
git add . ':(exclude).astro/data-store.json' ':(exclude).astro/settings.json'

$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..."
    git commit -m "Publish updated site $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} else {
    Write-Host "No changes to commit."
}

Write-Host "Pushing main..."
git pull --rebase --autostash origin main
git push origin main

Write-Host "Publishing docs/ to gh-pages..."
$deployWorktree = Join-Path ([System.IO.Path]::GetTempPath()) `
    "blog-gh-pages-$([Guid]::NewGuid().ToString('N'))"

try {
    git worktree add --detach $deployWorktree origin/gh-pages

    $resolvedWorktree = [System.IO.Path]::GetFullPath($deployWorktree)
    $deployDocs = [System.IO.Path]::GetFullPath(
        (Join-Path $resolvedWorktree 'docs'))

    if (-not $deployDocs.StartsWith(
        $resolvedWorktree + [System.IO.Path]::DirectorySeparatorChar,
        [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to replace docs outside the deployment worktree."
    }

    if (Test-Path -LiteralPath $deployDocs) {
        Remove-Item -LiteralPath $deployDocs -Recurse -Force
    }

    New-Item -ItemType Directory -Path $deployDocs | Out-Null
    $sourceDocs = Join-Path (Join-Path $PSScriptRoot 'docs') '*'
    Copy-Item -Path $sourceDocs `
        -Destination $deployDocs -Recurse -Force

    Push-Location $deployWorktree
    try {
        git add -A docs
        $deployStatus = git status --porcelain

        if ($deployStatus) {
            git commit -m "Deploy built site $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            git push origin HEAD:gh-pages --force
        } else {
            Write-Host "No gh-pages changes to deploy."
        }
    }
    finally {
        Pop-Location
    }
}
finally {
    if (Test-Path -LiteralPath $deployWorktree) {
        git worktree remove $deployWorktree --force
    }
}

Write-Host "Done! Your site should be live at https://blog.danmarshall.dev shortly."
