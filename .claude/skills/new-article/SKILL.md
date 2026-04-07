# New Article Skill

You are helping the user create and publish a new blog post on their Wintersmith blog at `C:\code\blog`.

Follow these steps in order. Do not skip any step.

---

## Step 1 — Gather content

Ask the user for the article content if they haven't already provided it. Accept any format: rough notes, a transcript, a draft, bullet points, or a full write-up.

---

## Step 2 — Ask about a hero image

Ask: "Do you have a hero image for this article? If so, drop the filename or path and I'll include it."

Wait for their response before continuing. It is optional — if they say no or skip it, continue without one.

---

## Step 3 — Draft the article

Rewrite or format the content as clean Markdown following these rules:

- Use `##` for top-level sections, `###` for subsections — never `#` (the title is rendered by the template)
- Use fenced code blocks with language tags (e.g. ` ```bash `, ` ```csharp `, ` ```json `) — never `powershell` (not supported by highlight.js)
- Use em dashes (—) not double hyphens (--)
- Use smart punctuation in prose but not inside code blocks
- Keep paragraphs concise — prefer short paragraphs over walls of text
- Use a `---` horizontal rule between major sections
- Tables should use standard Markdown pipe syntax

---

## Step 4 — Generate frontmatter

Produce a valid Wintersmith frontmatter block:

```
---
title: "<title>"
author: Dan Marshall
date: "<YYYY-MM-DD>"
tags: ["tag1", "tag2"]
template: article.pug
heroImage: /articles/<slug>/<filename>   ← only if an image was provided
---
```

Rules:
- `title` must be a quoted string
- `date` must be in `"YYYY-MM-DD"` format — use today's date if not specified
- `tags` must be a JSON array of strings — suggest relevant tags based on the content
- `template` is always `article.pug`
- `heroImage` path must start with `/articles/<slug>/` — only include if an image was provided
- Slug: lowercase, hyphens, no special characters (derived from the title)

---

## Step 5 — Proofread

Review the full draft and provide a short list of suggestions covering:
- Factual accuracy issues (flag anything that looks like an unverified claim)
- Clarity or structure improvements
- Tone consistency (the blog is technical but conversational — not formal, not chatty)
- Any missing sections that would improve the article

Present the suggestions clearly, then ask: "Would you like me to apply any of these before saving?"

Apply any requested changes, then confirm the final version with the user before writing the file.

---

## Step 6 — Create the article file

1. Create the directory: `C:\code\blog\contents\articles\<slug>\`
2. Write the article to: `C:\code\blog\contents\articles\<slug>\index.md`
3. If a hero image was provided and it is not already in the article directory, ask the user where it is and copy it to `C:\code\blog\contents\articles\<slug>\<filename>`

---

## Step 7 — Build and validate

Run:
```
cd C:/code/blog && npm run build
```

Check the build output for errors. If the article URL appears in the rendered tree, the frontmatter is valid. If the build fails, diagnose and fix before continuing.

---

## Step 8 — Preview

Tell the user: "The article is built. Preview it at http://localhost:3000/articles/<slug>/ — does it look good?"

Wait for confirmation before publishing.

---

## Step 9 — Publish

Run the publish script:
```
cd C:/code/blog && powershell -ExecutionPolicy Bypass -File publish.ps1
```

Confirm the push succeeded and share the live URL: `https://blog.danmarshall.dev/articles/<slug>/`
