---
title: "My resume is now a static site feature"
author: Dan Marshall
date: "2026-06-19"
tags: ["Astro", "resume", "CSS", "Playwright", "developer tools", "static sites"]
description: "I turned my resume into a versioned, printable, mobile-friendly page that is easier to share and keep current."
heroImage: /articles/my-resume-is-now-a-static-site-feature/cartoon.png
---

I did not set out to build resume infrastructure. I just wanted a clean resume link.

Something I could send to a recruiter without wondering whether it was the latest version. Something that looked decent on a phone. Something I could print without opening Word, nudging margins, exporting another PDF, and naming it some variation of `final-final`.

So my resume now lives on this site.

It is not a grand reinvention. It is just a page I can keep current. But that is exactly the point.

---

## The old workflow was annoying

The normal resume workflow is surprisingly bad.

You keep a document somewhere. You export a PDF. You upload it to job boards. You forget which version is current. You make a small edit. You export again. The formatting shifts. The old version is still attached to a profile somewhere.

I wanted less of that.

---

## Two pages, two jobs

I split the resume into two pages.

The full version is the source of truth:

```text
/articles/resume/
```

It has the detail: skills tables, recent projects, employment history, references, contact links, and the context that does not fit on one sheet of paper.

The short version is the thing I expect someone to print or skim:

```text
/articles/resume-brief/
```

That page has one job: fit on a single A4 page without turning into microscopic grey soup.

The important part is that both pages come from the same place I already maintain my writing. No separate design tool. No manual export step. No mystery version sitting in a downloads folder.

---

## A resume should be easy to use

For me, the useful requirements are simple:

- it should have a stable public URL
- it should work on mobile
- it should print cleanly
- it should have a short version and a detailed version
- it should be easy to update when my work changes

That is all this is trying to do.

---

## The one-page version matters

The full resume is useful when someone wants detail. But the one-page version is the one I expect people to actually skim.

That forced some useful decisions. What belongs above the fold? Which skills are signal, and which are just inventory? Which recent work explains the kind of engineer I am now?

The answer was not "squeeze everything in". The answer was to keep the one-page resume focused and let the full version carry the history.

The short version links to the full version. The full version links back. They can do different jobs without pretending one document can serve every context.

---

## The useful part is not the resume

The resume is just the artifact.

The useful part is reducing friction around something I will update repeatedly.

I do not want to think about where the current resume lives. I do not want to maintain three copies. I do not want the printable version and the web version to drift apart.

Now I have a link, a concise version, and a detailed version.

That is enough.
