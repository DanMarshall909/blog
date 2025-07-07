# PowerShell script to create a new article folder and open index.md in VS Code
param(
    [Parameter(Mandatory=$true)]
    [string]$slug,
    [string]$title = "New Article Title"
)

$articleDir = "contents/articles/$slug"
$articlePath = "$articleDir/index.md"

if (-not (Test-Path $articleDir)) {
    New-Item -ItemType Directory -Path $articleDir | Out-Null
}

$today = Get-Date -Format 'yyyy-MM-dd'
$frontMatter = @"
---
title: "$title"
description: ""
date: $today
author: "Dan Marshall"
template: article.pug
tags: []
---

# $title

Write your article here.
"@

Set-Content -Path $articlePath -Value $frontMatter -Encoding UTF8

# Open in VS Code
code $articlePath
