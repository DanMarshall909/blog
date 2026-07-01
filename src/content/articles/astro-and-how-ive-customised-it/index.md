---
title: "Building a Cheap Static Website with Astro and GitHub Pages"
author: Dan Marshall
date: "2026-06-25"
tags: ["Astro", "static sites", "GitHub Pages", "frontend", "developer tools"]
description: "A practical beginner-friendly guide to building a polished personal website cheaply with Astro, GitHub Pages, and a custom domain."
heroImage: /articles/astro-and-how-ive-customised-it/astro.png
heroImageCrop: true
cardImagePosition: "50% 50%"
---

If you want a website like this without spending much money, a static website is a very good option.

It is fast, cheap to host, and simple to maintain. For a personal site, blog, portfolio, resume page, or small business landing page, that is often all you need.

I built this blog with [Astro](https://astro.build/) because it gives me a solid foundation without making the setup feel heavy. But the bigger idea is simpler than Astro itself: you can get a polished, custom-looking website online for very little money.

You do not need a big hosting package.  
You do not need a server to manage.  
You do not need a database just to publish a few pages.

You can start with a static site and add more later only if you actually need it.

## What a static website actually is

A static site is mostly made from HTML, CSS, and sometimes a little JavaScript.

There is no backend server running your application. There is no database sitting behind every page. There is no admin dashboard or server control panel you need to babysit.

That sounds limiting, but for a lot of websites it is exactly the right trade-off.

A static site is good because:

- the pages load quickly
- hosting can be free or very cheap
- updates can be published from GitHub
- the whole site can be versioned in git
- there is less infrastructure to break
- there is less ongoing maintenance

For a portfolio, resume, blog, simple documentation site, or small landing page, that is usually more than enough.

## The cheap stack

A simple setup looks like this:

1. **Astro** for the site structure and content.
2. **GitHub** as the source of truth.
3. **GitHub Pages** for hosting.
4. **A custom domain** from a registrar like [VentraIP](https://ventraip.com.au/). This costs me about $70 a year for `danmarshal.dev`

That is enough to get a modern-looking site online without paying for a VPS, shared hosting plan, WordPress hosting, or a managed application platform.

The main cost is usually the domain name.

## Why I used Astro

Astro works well for this kind of site because it is designed for content-heavy websites.

That makes it a good fit for:

- blogs
- portfolio pages
- resumes
- documentation
- simple marketing pages

You can write content in Markdown, keep the structure clean, and still customise the design when you want to.

The part I like is that it does not force the site to become heavier than it needs to be. You can add JavaScript where it helps, but you are not forced to turn the whole site into a frontend application just to publish articles.

For a personal website, that is a strong default.

## Domain registration

If you want a proper web address, domain registration is usually the only recurring cost you need to think about.

I use [VentraIP](https://ventraip.com.au/) for domain registration because it is straightforward and gives me the DNS control I need.

The basic workflow is:

- buy the domain name
- open the DNS settings
- point the domain at GitHub Pages
- wait for the DNS records to propagate
- publish the site

Once that is done, your site can appear under your own domain instead of a default GitHub Pages address.

That is one of the nicest parts of this setup. You do not need to buy a large hosting package or learn a server control panel just to use a custom domain.

## Hosting with GitHub Pages

GitHub Pages is a practical hosting option for static websites.

It is free for personal projects, integrates directly with GitHub repositories, and works well with Astro builds.

The usual flow is:

- push your site to a GitHub repo
- configure the Astro build
- enable GitHub Pages in the repo settings
- publish the build output
- connect your custom domain

After that, updating the site is mostly a matter of changing the content, committing it, and pushing it to GitHub.

For a blog or portfolio, that is hard to beat.

## What this setup is good for

This approach works well when you want to publish:

- a blog
- a resume
- a portfolio
- a simple product landing page
- a small business website
- a documentation site

It is not trying to be a full application platform. That is the point.

The value is in keeping the site simple, fast, and easy to maintain.

## Limitations

There are a few limitations worth knowing before you start.

### No built-in database

A static site does not come with a database.

That means it is not the best fit if you need:

- user accounts
- private dashboards
- custom comments
- dynamic search over live data
- forms that store information directly in your own backend

You can still add external services for some of these things, but they are not built into the static site itself.

### No virtual machine

You also do not get a virtual machine where you can run arbitrary services.

If you need background jobs, long-running server processes, scheduled workers, custom APIs, or server-side runtime dependencies, this setup will probably become limiting.

That does not make it bad. It just means it has a clear job.

### No custom real-time features

Features like live chat, notifications, multiplayer interactions, or custom real-time APIs usually need a separate service.

For a personal website, that is usually fine. Most personal sites do not need real-time infrastructure.

## Why the trade-off is worth it

For most static content, the trade-off is excellent.

You get:

- low cost
- strong performance
- simple deployment
- fewer moving parts
- easy rollback through git
- a site that is not tied to a heavy hosting platform

That makes it much easier to actually ship something.

The site can start small, then grow naturally as you need more features.

## How I automate the boring parts

Once the site exists, the rest of the workflow becomes much easier.

I have also written about how I automate things like keeping my resume current and publishing article updates to LinkedIn in [my resume is now a static site feature](/articles/my-resume-is-now-a-static-site-feature/) and [I built a /blogpost command that writes, illustrates, and publishes for me](/articles/ai-blog-pipeline/).

That is the real win here.

The website is cheap to build, but the automation makes it feel much more like a useful publishing system than a one-off project.

## Final thought

If you want a website that looks polished without costing much, a static site built with Astro, hosted on GitHub Pages, and served under a custom domain is a very strong option.

It is simple enough to maintain, flexible enough to customise, and cheap enough that you can actually ship it.
