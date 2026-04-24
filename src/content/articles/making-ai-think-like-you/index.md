---
title: "Going meta: making AI think like me"
author: Dan Marshall
date: "2026-04-23"
tags: ["Claude Code", "AI", "productivity", "developer tools", "meta"]
description: "How I use Claude Code to keep myself on track — PRDs for scope, pomodoros for pace, rules files so I don't have to hold everything in my head."
heroImage: /articles/making-ai-think-like-you/cartoon.png
---

My brain is a drift machine. I start a task, notice something tangential, chase it, come back an hour later unsure what I was doing. PRDs help. Pomodoro helps. Continual feedback helps more.

What I've landed on with Claude Code is using it as external cognition for the stuff my brain isn't good at — holding the plan, remembering preferences, surfacing friction, noticing when I'm yak-shaving. This post is what works for me. Your mileage will vary.

---

## The problem I'm solving

Three things bite me repeatedly:

1. Losing the thread mid-session. I open a file to check one thing, notice a typo, fix it, then can't remember what I was originally looking for.
2. Re-explaining preferences every new conversation. "Write the test first." "Use `rg` not `grep`." "Don't push without asking." The same ten lines.
3. Forgetting lessons. I'll hit the same failure mode three times across three months and not connect them.

Claude Code can hold all three for me if I set it up right.

---

## The heredoc I never learn from

Halfway through a recent session I needed to append a story to a `prd.json` file. I reached for the hammer I use often — a bash heredoc piping JSON into `python -c`.

It blew up. The content had `%` and `${...}` in it. Bash ate the characters before Python saw them.

I wrote a one-shot script instead. Ten minutes lost.

Not a prompt-better problem. An *I keep doing this and failing the same way* problem. So I added a line to a shared rules file:

> Do **not** edit structured files via bash heredoc + `python -c` / `node -e` / `jq` inline scripts when the content contains `$`, `%`, backticks, or nested quotes. Prefer: write a short one-shot script to `scripts/<name>.py`, invoke it, optionally delete afterwards.

The point isn't that this is a profound insight — it's that writing it down stops me losing the same ten minutes next month.

---

## The four-times rule

Same session, I killed and restarted the .NET backend four times. Same five-line incantation each time. Never scripted it.

So I logged it. One line in a file called `automation-opportunities.md`:

```text
- 2026-04-23: Tour-store backend bounce done 4 times this session —
  kill PID on :5000 → dotnet build → source .env → dotnet run & →
  poll /api/locations until 200. Proposed: scripts/bounce-backend.sh.
```

The rule I've set for myself: log every multi-step pattern that repeats, but don't write the script until the **third** occurrence. First time is coincidence, second is pattern, third is cost.

Without the log I forget the friction by the next session and repeat it cold.

---

## Three tiers of memory

| Tier | What | Loaded when |
| --- | --- | --- |
| `CLAUDE.md` | Global profile — platform, active projects, workflow preferences, philosophy | Start of every session |
| `ai-rules/` | Shared rule files referenced by `@`-links from CLAUDE.md | Per project / skill |
| Skills | Slash commands that bundle multi-step workflows (`/reflect`, `/add-tasks`, `/blogpost`) | On invocation |

All plain text. All versioned in git. None of them are "prompts" in the prompt-engineering sense — they're configuration.

The global profile sits in a git repo. The rules live in a shared `ai-rules` repo I sync across machines. A clone-and-bootstrap on a new laptop gives me a Claude Code that already knows what I prefer.

---

## The feedback loop

I end non-trivial sessions with `/reflect`. It scans the conversation for things like:

- Skills that misfired or had missing steps
- Token waste — redundant reads, verbose output dumped inline
- Questions asked mid-task that could have been front-loaded
- Tools skipped for manual work — was it failure, or habit?
- Repeated patterns worth logging for later scripting

Each friction item becomes a proposed rule change, shown before-and-after, applied only when I confirm. Three minutes at the end of a session, and the lesson is preserved in a file instead of in my head.

Continual feedback is the feature. If I had to remember this stuff between sessions I wouldn't.

---

## Division of labour

The piece I added to my global profile after the last session:

> **Reserve for AI**: novel synthesis, unfamiliar code, judgement under ambiguity, drafting prose, pattern recognition across loose evidence. Things where "it depends" is an honest answer.
>
> **Reserve for heuristics, scripts, tools**: anything deterministic, repeatable, or verifiable. Same answer every time. Filtering output, running fixed sequences, reformatting known shapes.

When I catch AI doing heuristic work — `grep`ing through a log it just produced, running a 4-step sequence I could script in an hour, reformatting JSON by eye — I stop and move it to the heuristic side. Either a script now, or a log entry for later.

This maps cleanly onto how my attention works. The deterministic stuff is boring and I'll procrastinate it. The judgement calls are where I'm useful. Splitting them means I get to spend attention on the interesting part and the machine does the rest.

---

## What this looks like in practice

A session now usually goes:

1. `/add-tasks` — add a story to the PRD with acceptance criteria, or convert a whole PRD document into a structured backlog
2. Start the pomodoro (I run a small app at session start that tracks this)
3. Work on the story. When I drift, the plan file drags me back
4. At the end, `/reflect` to capture anything that rubbed

None of that is exotic. It's just three files (PRD, plan, rules) and a slash command. But it covers the three things my brain is bad at — scope, pace, and memory.

---

## Bringing it home

This is what's working for me. It might not for you. The specific tools (Claude Code, pomodoro, the rules repo) aren't the point — the shape is: let the AI hold the parts of the work your brain keeps dropping, keep the parts your brain is actually good at, and build up the configuration over time so you're not rebuilding from scratch every session.

For me that's the difference between feeling productive for two hours and looking up at 6pm wondering where the day went.
