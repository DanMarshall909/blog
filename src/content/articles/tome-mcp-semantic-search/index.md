---
title: "Tome: semantic search for books, docs, and source code"
author: Dan Marshall
date: "2026-06-24"
tags: ["AI", "MCP", "semantic search", "local AI", "Python", "developer tools"]
description: "Tome is a Python MCP server for local semantic search over books, long-form documents, and C# source files using Ollama embeddings and LanceDB."
---

I built [Tome](https://github.com/DanMarshall909/tome) because I wanted semantic search over material that does not fit neatly into a chat window.

Most AI tooling is good at the immediate conversation. It is less good at the surrounding library: books, long-form notes, PDFs, old Word documents, Markdown files, and source code that I may want to query repeatedly.

Tome is my attempt to make that material searchable from an AI workflow without sending it to a cloud embedding API.

## What it does

Tome is a Python MCP server for semantically searching books, long-form documents, and C# source files.

It ingests common document formats, breaks the text into searchable chunks, embeds them locally with Ollama, and stores the result in a LanceDB vector index.

The result is a local semantic-search layer that an MCP-compatible client can call directly.

## Why MCP

The Model Context Protocol is useful here because Tome is not meant to be another standalone search app.

I want it available inside the place where I am already working with an AI assistant.

That gives the project a narrow job:

```text
ingest useful documents
index them locally
search them semantically
return relevant context to the assistant
```

The tool surface is deliberately small: ingest material, search it, inspect the index, or reset it.

The value is not a complicated UI. The value is giving the assistant a reliable way to retrieve local context.

## Local embeddings by default

Tome uses local embeddings by default.

That choice is intentional.

For personal notes, books, drafts, and source code, local-first matters. A cloud embedding API can be convenient, but it also means every chunk of indexed text leaves the machine. Sometimes that is fine. Sometimes it is not.

Tome keeps the default path conservative: local files, local embeddings, local vector index, and an MCP interface for the assistant.

That does not make it universally better. It does make the privacy and operational boundaries easier to reason about.

## What it is useful for

The obvious use case is searching books and notes:

```text
What does my library say about attention?
```

But the more interesting use case for me is developer context.

Long codebases and long documents have the same problem: the important detail is often somewhere, but not necessarily somewhere I remember.

Tome can index C# source files alongside prose. That makes it useful for questions like:

```text
Where does this codebase talk about customer identity?
```

or:

```text
Which files mention the payment reconciliation flow?
```

This is not a replacement for static analysis, grep, or an IDE. It is a different retrieval shape. Semantic search helps when I know the concept but not the exact term.

## The Claude Code skill

The repo also includes a Claude Code skill that wraps the MCP tools with safer defaults.

That matters because an MCP server exposes capabilities, but a skill can define workflow.

For Tome, the skill keeps the normal workflow simple: check what is indexed, ingest new material when needed, search from natural-language prompts, and require confirmation before destructive operations.

## Project shape

The implementation is intentionally modular. File loading, embedding, vector storage, and MCP tool wiring are separate concerns.

That means the project can grow without locking everything to one file format, one embedding backend, or one vector store.

The current public repo is here:

[github.com/DanMarshall909/tome](https://github.com/DanMarshall909/tome)

It is one of the smaller pieces of my broader AI-assisted engineering setup, but it captures a theme I keep coming back to: useful AI systems need good context plumbing, not just better prompts.
