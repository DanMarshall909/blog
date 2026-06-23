---
title: "Building a custom job-search ranking workflow"
author: Dan Marshall
date: "2026-06-23"
tags: ["AI", "job search", "developer tools", "automation", "search"]
description: "How I used an AI-assisted browser workflow to turn noisy job listings into a ranked, reviewable shortlist."
heroImage: /articles/ai-assisted-job-search/cartoon-hero.jpg
---

Job search has a poor signal-to-noise ratio.

A typical search produces duplicate listings, vague salary information, hidden recruiters, unclear work arrangements, expired roles, and job descriptions that use the same words to mean very different things. The hard part is rarely finding more listings. The hard part is deciding which listings are worth inspecting.

So I built a small search workflow around that problem.

Not a fully automated job applier. I do not want software submitting applications on my behalf. Applying for work is a judgement call, and anything sent under my name is still my responsibility.

The goal was narrower: gather job listings, extract the useful details, compare them against explicit criteria, and return a small ranked shortlist.

## The first rule: write the criteria down

The most useful part of the workflow was not the browser automation. It was making the decision criteria explicit.

For this search, the workflow considers things like:

- Role seniority and technical fit
- Backend, frontend, cloud, platform, and AI-related signals
- Engineering culture indicators such as testing, code review, CI/CD, maintainability, and refactoring
- Whether AI-assisted development appears to be accepted or encouraged
- Work mode, location, and practical availability
- Compensation clarity
- Recruiter ambiguity
- Domain or product fit
- Obvious next action

That last point matters. A large list is not automatically useful. If the real decision is “which two roles should I inspect next?”, then twenty loosely matched jobs is just more work.

The output needs to be a ranked shortlist, not a tab explosion.

## Turning criteria into tooling

I saved the process as a reusable agent workflow.

The workflow defines what the agent is allowed to do, what information it should extract, how it should rank results, and where it must stop.

The rules are deliberately simple:

1. Use the existing browser session where possible
2. Open searches in separate tabs
3. Inspect results in small batches
4. Extract visible job cards and job links
5. Open detail pages only for promising matches
6. Rank roles by explicit fit criteria
7. Flag missing information and risks
8. Stop before final submission

The stop-before-submission rule is important.

Automation can help with searching, summarising, extracting, ranking, and preparing next actions. But final submission should remain a human decision.

## How the job-search workflow works technically

The job-search workflow is browser-driven rather than a blind scraper.

I built it as a small repeatable agent workflow with three responsibilities:

1. Drive the browser
2. Extract useful job information
3. Rank the results into a small shortlist

The key design choice was to use my existing browser session instead of launching a fresh headless browser. The agent attaches to Chrome through the Chrome DevTools Protocol using Playwright. That means it can work with an already logged-in session, open searches in visible tabs, and let me interrupt or take over at any point.

Conceptually, the flow looks like this:

```text
Attach to the existing Chrome session
Open targeted job searches in new tabs
Read visible job cards from the results page
Extract job links and basic metadata
Open only promising job detail pages
Extract richer role information
Rank each role against explicit criteria
Return a small shortlist with blockers and next actions
Stop before submitting anything
```

The browser connection is done through Playwright over Chrome remote debugging:

```ts
import { chromium } from "playwright";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const context = browser.contexts()[0];
const page = await context.newPage();
```

From there, the workflow opens a small set of targeted searches rather than trying to collect every possible listing.

For example, the searches are shaped around role type, technology stack, location, and work mode:

```text
Senior .NET roles
Senior C# / Azure roles
Remote AI-focused engineering roles
Full-stack roles with strong backend alignment
```

On each search page, the agent extracts visible job cards from the DOM. The first-pass data is intentionally lightweight:

```ts
type JobCard = {
  title: string;
  company?: string;
  location?: string;
  workMode?: "remote" | "hybrid" | "onsite" | "unknown";
  postedAge?: string;
  salaryText?: string;
  link: string;
  source: string;
};
```

The first pass is just triage. It is not worth opening every listing. The workflow looks for obvious fit signals, then opens only the roles that appear worth inspecting.

For each promising role, the agent opens the detail page and extracts a richer shape:

```ts
type JobDetail = JobCard & {
  descriptionText: string;
  detectedTechnologies: string[];
  aiSignals: string[];
  engineeringCultureSignals: string[];
  compensationSignals: string[];
  locationSignals: string[];
  recruiterSignals: string[];
  riskFlags: string[];
};
```

The useful part is the normalisation step. Job ads are inconsistent, so the workflow turns messy text into comparable signals.

It looks for things like:

```text
Technology fit:
C#, .NET, Azure, React, TypeScript, APIs, microservices, cloud, platform engineering

AI signal:
LLMs, RAG, agents, model evaluation, internal AI tools, applied AI product work

Engineering culture signal:
TDD, automated testing, code review, CI/CD, refactoring, observability, maintainability

Practical fit:
work mode, location, compensation clarity, recruiter ambiguity, domain fit
```

Each role is then ranked with a simple scoring model. This is not complicated machine learning. It is an explicit rubric.

```ts
type RankedJob = JobDetail & {
  score: number;
  fit: "strong" | "possible" | "weak";
  reasons: string[];
  blockers: string[];
  nextAction: string;
};
```

A simplified scoring pass looks like this:

```ts
function rankJob(job: JobDetail): RankedJob {
  let score = 0;
  const reasons: string[] = [];
  const blockers: string[] = [];

  if (job.detectedTechnologies.length > 0) {
    score += 20;
    reasons.push("Relevant technology match");
  }

  if (job.aiSignals.length > 0) {
    score += 20;
    reasons.push("AI-related work is present");
  }

  if (job.engineeringCultureSignals.length > 0) {
    score += 15;
    reasons.push("Good engineering culture signals");
  }

  if (job.compensationSignals.length > 0) {
    score += 10;
    reasons.push("Compensation information is visible");
  } else {
    blockers.push("Compensation needs confirmation");
  }

  if (job.recruiterSignals.length > 0) {
    blockers.push("Recruiter listing needs clarification");
  }

  if (job.riskFlags.length > 0) {
    score -= 20;
    blockers.push("Potential role or domain mismatch");
  }

  const fit =
    score >= 55 ? "strong" :
    score >= 35 ? "possible" :
    "weak";

  return {
    ...job,
    score,
    fit,
    reasons,
    blockers,
    nextAction: blockers.length > 0
      ? "Verify missing information before applying"
      : "Review manually before applying"
  };
}
```

The final output is not a large dump of every listing. It is a short decision list:

```md
## Shortlist

### 1. Senior Software Engineer — Strong match

**Why it fits**
- Relevant technical stack
- Good engineering culture signals
- Practical work mode

**Blockers**
- Compensation needs confirmation

**Next action**
Confirm the missing details before applying.
```

The workflow also separates roles that look promising but need verification:

```md
## Verify first

### AI Engineer — Possible match

**Why it might fit**
- Strong AI engineering signal
- Relevant backend/platform work

**Needs checking**
- End client is unclear
- Work mode is ambiguous
- Compensation range is not listed

**Next action**
Ask recruiter for the missing details before spending time on the application.
```

The reusable logic lives in a local agent skill, so the process can be repeated without re-explaining the criteria every time.

The important technical pattern is:

```text
Browser automation for gathering
Structured extraction for comparison
Explicit scoring for ranking
Human review before action
```

That keeps the workflow useful without turning it into an uncontrolled application bot.

## Why a visible browser matters

For this workflow, visible automation is more trustworthy than hidden automation.

Job sites are full of fragile state: authentication, redirects, iframes, form steps, client-side rendering, expired listings, and recruiter-specific application flows. A headless browser can work, but it is harder to supervise and easier to mistrust.

Attaching to a normal browser session gives the workflow a better operating model:

- I can see what the agent is doing
- I can interrupt it
- I can close irrelevant tabs
- I can manually inspect anything suspicious
- I can stop before an application is submitted

That is the right level of automation for a high-context task.

The agent drives the repetitive parts. I keep control of the irreversible parts.

## Searching in small batches

The useful searches were intentionally boring.

The workflow was not trying to scrape an entire platform. It was trying to answer a smaller question:

> Which few roles should I inspect next?

That changes the shape of the tool.

A broad scrape would optimise for volume. This workflow optimises for decision quality.

For each search batch, the agent looks for:

- Relevant role titles
- Matching technologies
- Applied AI or automation signals
- Quality engineering signals
- Practical work mode
- Compensation clarity
- Recruiter ambiguity
- Domain or product risk

The ranking step is where the value is. Search results are cheap. Good filtering is the work.

## Handling recruiter ambiguity

Recruiter listings are often worth inspecting, but they commonly hide the end client, product domain, compensation range, or practical work expectations.

The workflow keeps reusable verification questions ready:

```text
Before I spend time on the process, can you confirm the end client or product domain?
```

```text
Can you confirm the compensation range, expected office days, and whether the role is hands-on engineering?
```

```text
How does the team approach automated testing, code review, refactoring, and maintainability?
```

```text
Are engineers encouraged to use AI-assisted development tools in normal delivery work?
```

These are not clever questions. They are friction reducers.

They turn vague uncertainty into explicit information.

## Why this works

The important design choice is not “AI searches job boards”.

The important design choice is that the workflow keeps the decision surface small.

I do not want:

- Dozens of tabs
- Repeatedly reading the same listing structure
- Salary hidden until late in the process
- Recruiter ambiguity left unresolved
- Re-explaining the same criteria every session
- Automation submitting something before review

I do want:

- A ranked top three
- A “verify first” section
- Clear blockers
- Reusable recruiter questions
- Persistent search criteria
- A hard stop before submission

This is not about removing judgement. It is about protecting judgement from being wasted on tab management, duplicate listings, and repetitive form-reading.

## The broader pattern

The same pattern applies well outside job search:

1. Make the criteria explicit
2. Save them somewhere the agent will actually read
3. Let automation gather and normalise noisy data
4. Keep the human in charge of irreversible actions
5. Return small ranked choices, not huge raw dumps

That last point is the difference between automation that helps and automation that just creates another inbox.

The goal is not to automate the decision.

The goal is to make the decision easier to see.
