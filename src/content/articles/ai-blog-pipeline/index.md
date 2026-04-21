---
title: "I built a /blogpost command that writes, illustrates, and publishes for me"
author: Dan Marshall
date: "2026-04-21"
tags: ["Claude Code", "AI", "ComfyUI", "automation", "developer tools", "LinkedIn"]
description: "One /blogpost command: Claude drafts the article, generates cartoon illustrations locally with Flux, previews in the browser, publishes to GitHub Pages, and fires off a LinkedIn post — all without leaving the terminal."
heroImage: /articles/ai-blog-pipeline/cartoon.png
---

Today I built a `/blogpost` skill for Claude Code that takes an idea and handles everything through to a live post with a cartoon illustration and a LinkedIn update.

Here's what happens when I type `/blogpost`:

1. Claude drafts the article in my Astro blog
2. ComfyUI starts up locally (if it isn't already running) and generates 3 cartoon hero images — one character-focused, one metaphor, one scene
3. I pick the best image
4. Claude opens a browser preview via the chrome-devtools MCP
5. I say **publish** — it builds, commits, and pushes to GitHub Pages
6. The LinkedIn post gets drafted and posted via a Python CLI tool

The whole thing is a Claude Code skill — a markdown file that Claude reads and executes step by step.

---

## How the image generation works

The images are generated locally using [ComfyUI](https://github.com/comfyanonymous/ComfyUI) with a Flux fp8 model. No API costs, no rate limits, no sending your content to a third party.

Claude constructs a ComfyUI workflow JSON and POSTs it to the local API:

```python
workflow = {
  "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev-fp8.safetensors"}},
  "2": {"class_type": "CLIPTextEncodeFlux", "inputs": {
    "clip": ["1", 1], "clip_l": prompt, "t5xxl": prompt, "guidance": 5.0
  }},
  "4": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
  "5": {"class_type": "KSampler", "inputs": {
    "seed": seed, "steps": 35, "cfg": 1.0,
    "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0,
    ...
  }},
  ...
}
```

Rather than polling the ComfyUI API to check if it's done, the skill watches the output folder directly:

```python
output_dir = r"C:\flux\ComfyUI_windows_portable\ComfyUI\output"
expected = ["blog_v1_00001_.png", "blog_v2_00001_.png", "blog_v3_00001_.png"]

for i in range(200):
    time.sleep(3)
    for fname in expected:
        fpath = os.path.join(output_dir, fname)
        if os.path.exists(fpath):
            shutil.copy2(fpath, dest)
            found.add(fname)
```

This runs in the background — Claude gets notified when all 3 are ready and proceeds automatically.

The 3 distinct angles matter. Early versions generated 5 variations of the same prompt and the results were nearly identical. Giving each image a different brief (character / object / environment) means you actually have something to choose between.

---

## The LinkedIn integration

LinkedIn posting uses the official API with OAuth2. The flow:

1. One-time setup: `python linkedin_post.py --auth` — opens the browser, saves tokens to `~/.linkedin_token.json`
2. Posting: `python linkedin_post.py "post text"` — checks token expiry, refreshes if needed, posts

A few things that weren't obvious from the docs:

**Use `/rest/posts`, not `/ugcPosts`** — the older endpoint is deprecated. The new one requires a `LinkedIn-Version: YYYYMM` header.

**You need two LinkedIn products provisioned**, not one. `w_member_social` alone gives you posting rights but no way to get the author's person ID. You also need "Sign In with LinkedIn using OpenID Connect" for the `openid profile` scopes. The person ID comes from `/v2/userinfo` as the `sub` field:

```python
resp = requests.get("https://api.linkedin.com/v2/userinfo", headers=auth_headers(tokens))
person_id = resp.json()["sub"]
```

**Windows encoding** — if you're on Windows and post text contains emoji, force UTF-8 on stdout:

```python
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
```

---

## The skill itself

The whole pipeline is a markdown file that Claude reads as instructions. No framework, no config — just a description of what to do and in what order.

Skills live in `~/.claude/skills/<name>/SKILL.md`. They're loaded into context when invoked and Claude follows them step by step. The blogpost skill is about 250 lines and covers every edge case we hit building it: ComfyUI startup, port detection for the dev server, where to save images so Astro can serve them, when to add `heroImage` to frontmatter (after the image exists, not before).

The LinkedIn poster is a separate `linkedin-post` skill that wraps the Python CLI — so it can be called from `/blogpost` or standalone from anything else.

I also added a line to my `CLAUDE.md` so Claude proactively suggests a LinkedIn post at the end of any session where something interesting gets built. It's easy to forget to share things publicly — having the suggestion baked into the workflow means it actually happens.

---

## What it looks like in practice

This post was written and published through the pipeline. The cartoon above was generated by the Flux model running on my laptop GPU, picked from 3 options, and placed automatically.

Total time from "make a blogpost about this" to live: about 10 minutes, most of which was image generation.
