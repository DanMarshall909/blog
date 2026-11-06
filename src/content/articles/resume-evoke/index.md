---
title: "Evoke Interactive Resume"
description: "AI engineer and senior full-stack developer with commercial AI delivery experience and DnDan, a pre-alpha narrative RPG engine with procedural world research."
date: "2026-11-06"
author: "Dan Marshall"
tags: [resume, career, ai, csharp]
unlisted: true
heroImage: /articles/resume/profile-alpha-trimmed.png
heroImagePosition: "10px 5px"
heroImageScale: 1
headerImagePosition: "50% 15%"
headerImageScale: 1.12
cardImagePosition: "50% 15%"
cardImageScale: 1.12
---

# Dan Marshall

**AI Engineer and Senior Full-Stack Engineer** with 11+ years of software engineering experience. Combines deployed commercial AI systems with hands-on development of DnDan, a pre-alpha roleplaying game engine. This brings a close practical fit to Evoke Interactive's Arkham Catacombs: model integration, reliable application state, backend engineering and AI-driven storytelling.

[danmarshall909@gmail.com](mailto:danmarshall909@gmail.com) · [github.com/DanMarshall909](https://github.com/DanMarshall909)<br>
[linkedin.com/in/developerdan](https://www.linkedin.com/in/developerdan) · [blog.danmarshall.dev](https://blog.danmarshall.dev)

## Relevant skills

- **AI engineering:** AWS Bedrock, OpenAI, Claude API, LangChain4j, retrieval-augmented generation (RAG), guardrails, model selection, local LLMs, prompt engineering and MCP.
- **Product engineering:** C#/.NET, Kotlin/Spring Boot, TypeScript, React, Angular, REST APIs, GraphQL, SQL and event-driven services.
- **Cloud and delivery:** Azure, AWS, Docker, observability, CI/CD, TDD, integration testing, mutation testing and code review.

## Recent professional experience

### Rapid Circle

**Senior Consultant | July 2026 - November 2026**

- Rewrote CFMEU's wage-claims system from proof of concept to a deployed application employing RAG; fixed security flaws, optimised resource use and added extensive automated tests.
- Built screen-activity capture and summarisation with ConnectWise integration, OCR, local LLM support and encryption at rest.
- Built an end-to-end proof of concept for Siemens.

### Reapit

**Senior AI Engineer | September 2025 - February 2026**

- Workshopped, built and deployed an AI-driven property inspection system using AWS Bedrock, producing structured assessment reports constrained by business rules.
- Extended LangChain4j with Bedrock guardrail support, then migrated to the official implementation when upstream support became available.
- Selected models against cost, accuracy, features, performance and token usage; delivered with Kotlin, Spring Boot and AWS.

### RACT

**Senior Software Engineer - Back-end | June 2024 - July 2025**

- Modernised .NET Framework 4.7.2 components to .NET 9 and built services using Clean Architecture, DDD, MassTransit, WebAPI, GraphQL and SQL Server.
- Contributed to an AI coding-rules pilot.

## Education

**B.Sc. Mathematics and Computer Science** - University of South Africa (UNISA).

<section class="resume-portfolio-page">

## DnDan: an AI roleplaying game engine

**Independent project | Approximately six months of development | Pre-alpha**

DnDan aims to capture the freedom of tabletop roleplaying. Areas are intended to be generated progressively as the story unfolds and player choices shape the adventure. Upcoming locations can be prepared ahead of play, while visited places are preserved in the save.

- **Rules:** implementing the full D&D 5e ruleset defined by the System Reference Document (SRD 5.2.1). Full rules coverage is still in development.
- **Architecture:** C# core, provisional Godot client and SQLite saves. AI performs the narrative and characters, while a separate rules engine controls mechanics and world changes.
- **Implemented foundations:** exploration and combat with save-and-resume, live character conversations, and bounded preparation of upcoming locations while play continues.
- **Visual research:** initial scene geometry, generated visual treatments and normal/depth-based relighting in Godot.
- **Animation and character equipment:** experiments with AI-assisted image-to-3D characters, skeletal rigging and a tested 30 fps walk cycle. Separate armour-fitting studies explore attaching generated equipment to an animated body; garment coverage and clipping still need refinement.

These experiments complement my commercial AI engineering experience and give me practical context for Evoke's narrative RPG ambitions. I am also open to discussing whether licensing or adapting parts of DnDan could accelerate development, subject to technical fit and agreed commercial terms.

### The engine in play

<div class="resume-gallery">
<figure>
<img src="/articles/resume-evoke/live-innkeeper-dialogue.png" alt="DnDan Godot client showing a live innkeeper conversation alongside evidence, decisions and save controls" width="1280" height="800" loading="eager" />
<figcaption><strong>Live character dialogue.</strong> Local-model conversation alongside recorded evidence, player decisions and save controls.</figcaption>
</figure>
<figure>
<img src="/articles/resume-evoke/committed-roadside-scene.png" alt="DnDan client displaying a generated roadside location restored from a save after restart" width="1280" height="800" loading="eager" />
<figcaption><strong>Progressive generation prototype.</strong> A bounded, model-authored roadside layout validated by the engine and restored after restart.</figcaption>
</figure>
</div>

</section>

<section class="resume-portfolio-page">

## Geometry and dynamic lighting

Scene 02 study: initial geometry, reconstructed surface normals and actual Godot relighting captures.

<div class="resume-gallery resume-gallery-rendering">
<figure>
<img src="/articles/resume-evoke/initial-geometry.png" alt="Initial Godot scene geometry with anchored props and an open doorway" width="768" height="768" loading="eager" />
<figcaption><strong>Initial engine geometry.</strong> Godot blockout with anchored props and an open doorway.</figcaption>
</figure>
<figure>
<img src="/articles/resume-evoke/presentation-normals.png" alt="Colour-coded surface normal map reconstructed from estimated depth of the generated scene artwork" width="1271" height="1238" loading="eager" />
<figcaption><strong>Presentation normals.</strong> Surface normals reconstructed from estimated depth of the generated visual treatment.</figcaption>
</figure>
<figure>
<img src="/articles/resume-evoke/foreground-lighting.png" alt="Godot renderer lighting the foreground of the generated dungeon scene" width="1024" height="998" loading="eager" />
<figcaption><strong>Light on the foreground.</strong> Godot renderer output using the visual plate, presentation normals and depth.</figcaption>
</figure>
<figure>
<img src="/articles/resume-evoke/alternate-lighting.png" alt="The same dungeon image relit toward the eastern sarcophagus and roots" width="1024" height="998" loading="eager" />
<figcaption><strong>Alternate light position.</strong> Light shifts towards the eastern sarcophagus and roots; the underlying visual plate is unchanged.</figcaption>
</figure>
</div>

The detailed artwork is AI-generated presentation, and its normals are derived from estimated depth. This rendering study is separate from the current gameplay client; matching generated artwork to engine geometry remains under development.

</section>

<section class="resume-portfolio-page">

## A larger dungeon scene

A multi-room visual study with connected chambers around a central hall.

<figure class="resume-feature-image">
<img src="/articles/resume-evoke/large-dungeon-overview.png" alt="Large generated dungeon overview showing a central hall, crypt, library, flooded chamber and ritual room" width="1312" height="1199" loading="eager" />
<figcaption><strong>Full dungeon overview.</strong> Generated scene artwork shows a crypt, library, flooded chamber and ritual room connected through a central hall.</figcaption>
</figure>

The following image shows the same dungeon in the Godot renderer, with lighting and a surface grid over the generated floor.

</section>

<section class="resume-portfolio-page">

## Grid over the generated dungeon floor

Godot renderer capture with a depth-based surface grid over the generated scene.

<figure class="resume-feature-image">
<img src="/articles/resume-evoke/dungeon-floor-grid.png" alt="Actual Godot renderer capture with an orange grid overlapping the generated dungeon floor and extending around the foreground pillar" width="1024" height="998" loading="eager" />
<figcaption><strong>Grid over generated floor.</strong> The surface grid is visible across the central hall and follows depth-derived surfaces around the foreground pillar, while the dungeon artwork remains visible beneath it.</figcaption>
</figure>

This actual renderer capture shows lighting and the grid overlay together. The grid visualises reconstructed surface depth; it is part of the rendering research in this pre-alpha engine.

</section>
