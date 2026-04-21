---
title: "Claude Code is wasting ~9,400 tokens every session — here's the fix"
author: Dan Marshall
date: "2026-04-21"
tags: ["Claude Code", "AI", "productivity", "LLM", "developer tools"]
description: "Claude Code silently loads MCP server definitions for integrations you've never used. Here's how to find out how bad it is and fix it in 30 seconds."
heroImage: /articles/claude-code-mcp-token-waste/cartoon.png
---

Run `/context` in Claude Code. Look at the **System tools** line.

You'll see something like 10,500 tokens loaded every single session. A big chunk of that is MCP server definitions for integrations you almost certainly aren't using — Asana, Atlassian, Box, Canva, HubSpot, Intercom, Linear, Monday.com, Notion.

Here's what my breakdown looked like:

```
System prompt:  6k tokens  (3.0%)
System tools:  10.5k tokens (5.2%)   ← most of this is unused MCP servers
Memory files:   2.9k tokens (1.5%)
Skills:         1.5k tokens (0.8%)
Messages:       8 tokens   (0.0%)
```

Those tool definitions sit in your KV cache on every request. You pay for them whether you use them or not. And because they're in the cache, they displace context that actually matters — your code, your conversation, your instructions.

---

## Why does this happen?

Claude Code ships with a bunch of third-party MCP integrations pre-loaded. They're useful if you connect them, but the definitions get loaded regardless of whether you've authenticated or ever intend to use them.

It's not a bug exactly — it's just a default that doesn't age well once you know what you're looking at.

---

## The fix

Open `~/.claude/settings.json` and add a `deniedMcpServers` block:

```json
"deniedMcpServers": [
  { "serverName": "claude_ai_Asana" },
  { "serverName": "claude_ai_Atlassian" },
  { "serverName": "claude_ai_Box" },
  { "serverName": "claude_ai_Canva" },
  { "serverName": "claude_ai_HubSpot" },
  { "serverName": "claude_ai_Intercom" },
  { "serverName": "claude_ai_Linear" },
  { "serverName": "claude_ai_monday_com" },
  { "serverName": "claude_ai_Notion" }
]
```

Keep any you actually use. Restart Claude Code, run `/context` again, and watch that number drop.

---

## Is this worth bothering with?

~9,400 tokens sounds small against a 200k context window. But:

- It's paid on **every session**, not amortised
- It erodes your KV cache hit rate, making responses slower and more expensive
- It compounds — the less relevant noise in your cache, the more effective prompt caching is on what remains

30 seconds of config. Zero downside if you're not using those integrations.
