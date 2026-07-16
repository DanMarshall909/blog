---
title: "Make VS Code open Markdown in preview by default"
author: Dan Marshall
date: "2026-07-16"
tags: ["VS Code", "Markdown", "developer tools"]
description: "A tiny VS Code workspace setting that makes Markdown files open in preview mode instead of the editor."
---

If you spend a lot of time reading Markdown, VS Code can be a little too eager to drop you into edit mode.

The fix is simple: add a workspace setting that tells VS Code to open `*.md` files in the Markdown preview editor.

Create `.vscode/settings.json` in the repo and add this:

```json
{
  "workbench.editorAssociations": {
    "*.md": "vscode.markdown.preview.editor"
  }
}
```

That is it. From then on, Markdown files in that workspace open as preview first.

I like this because it keeps docs browsing friction low without changing your global editor preferences. It is also easy to undo later if you decide you want the normal editor back.

If you want the same behavior for other Markdown-style files, you can add more patterns alongside `*.md`, such as `*.markdown` or `*.mdx`.
