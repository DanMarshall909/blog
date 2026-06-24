---
title: "AI needs guardrails, not rubber stamps"
author: Dan Marshall
date: "2026-06-23"
tags: ["ai", "ai assisted development", "testing"]
description: "Approving AI-written code is too easy to rubber-stamp. The quality comes back when you write the scaffolding, tests, tooling, and constraints first."
heroImage: /articles/ai-needs-guardrails-not-rubber-stamps/rubber_stamp-hero.png
---

> The only way to go fast is to go well.
>
> - Robert C. Martin

## Introduction

I get what many people are saying. There is a real value in AI-generated code instead of writing every line yourself. But approving code is prone to rubber stamping. It works. Yes, I would have done it differently, but it's too exhausting to make it better. Just get it shipped... I know, because I used to do it a lot myself.

This is not even a new problem. Pull requests can create the same failure mode in traditional workflows. The author disappears into a branch, comes back with a slab of code, and the reviewer is expected to reconstruct all of the thinking after the fact. That is hard work, so review becomes a gate, then a skim, then a rubber stamp. AI assisted development can replicate the same pattern at higher speed: the machine disappears into the implementation, comes back with a slab of code, and now I am the tired reviewer trying to reverse-engineer the decisions.

Pair programming fixes this in both cases because the thinking happens while the code is being shaped. You do not review the finished mystery object; you participate in the choices that created it. With AI, the equivalent is staying in the loop: write the scaffolding, constrain the architecture, guide the tests, and correct the shape while it is still cheap.

That matters because review is not just a logical exercise. It is also an attention problem. If the code follows my conventions, uses the shapes I expect, and puts things where I would naturally look for them, reading it is more pleasant. When reading it is more pleasant, I am much more likely to actually review it instead of skimming until the green ticks reassure me.

So if I am honest, the quality of the code I was shipping for a while was poor compared to what I used to produce when I wrote every line by hand. Not because AI is useless. My 40-plus years behind a keyboard did not count for nought. I just was not applying my expertise in the right place - I was letting the machine fill too much of the shape of the solution. I was telling it what but not how.

## But, isn't AI assisted TDD/BDD going to save us?

The how is something I've always been very wary of specifying. An important principle of BDD is that implementation detail should stay out of your acceptance criteria.

And that's a very good rule in general. TDD does produce loosely coupled code on the whole, but AI often does not do very well on the refactor step. In fact I've written TDD frameworks to enforce this because it simply WOULD NOT LISTEN. In its zeal to get the tests passing it would write all sorts of slop. The solution worked, but it was not something I'd happily put my name behind.

The point of AI assisted development is to improve velocity, which is exactly the same goal as automated testing, but illegible code and lack of structure meant I found things very hard to follow. I was discouraged to even read the code any longer because it was exhausting.

Acceptance criteria should describe behaviour, but the architecture itself needs constraints, examples, and feedback loops. In the past I would do this instinctively. I leant on my experience to write well structured code. 

That has improved a lot now that a fistful of pennies have dropped, and the change was not a better prompt. It was a maturation in how I think about AI-assisted development.

## The pennies

Here are the main things that I have found have made the real difference:

### I start a project with static analysis settings cranked up

First things first. I set up the things that can prevent code rot automagically. I install linting tools, security tools, set warnings as failures and all language settings on their most strict possible setting. BEFORE I DO ANYTHING. I set coverage targets to 100% on business logic, and git hooks to prevent pushes without running the test suite.

Easy wins for long term benefit, but hard to add after the fact.

### I establish patterns as early as possible via tracer bullets

I use [Tracer Bullets](https://www.artima.com/articles/tracer-bullets-and-prototypes) as defined in the Pragmatic Programmer by Andy Hunt and Dave Thomas - essentially I write a representative feature myself to flesh out how I intend the rest of the system to work. It should be simple enough to not overwhelm with detail, but cover the majority of architectural components. I pay attention to detail here. I don't just finish up the feature because it works. This is the template for similar work moving forward.

### I build the test harness

The quality of the test harness is vital if you intend to test effectively. If done correctly it will shape the way the dependency management in your production code is written, ensuring that it is loosely coupled. If this doesn't happen early you will find yourself constantly revisiting the same spots of code to hack in test seams. It's not fun, makes for huge test harnesses and often isn't an accurate test of the production code.

### I insist on mutation testing

This is because line coverage is useful to a degree, but can be a comfort blanket. It may show you potholes in the road but not whether they have been filled properly. In other words it does not tell you the assertions meant anything, and that is typical of AI generated tests. Mutation testing also can efficiently point out gaps in your acceptance criteria too, which means that the solution becomes better fit for purpose.

### I use architectural tests to enforce the patterns I've uncovered

I'm obviously a big fan of automated quality control, but linting alone won't save you from more bespoke issues. That's where adding your own semantic tests can pay off. This is quite an advanced topic, but if you can prevent things being written in the wrong layers you've essentially insulated yourself from more pain down the track. You can, for example, ensure that the Result Pattern is observed and that only custom exceptions are thrown with corresponding middleware to handle them. In solutions where modules are not easily enforceable via project structure (TypeScript / Python for example) you can make sure that high level namespaces are forbidden to use low level ones. You can enforce the need to document public interfaces and provide examples for API endpoints etc.

## Conclusion

The important shift is this: I do not treat AI as a junior developer. That narrative is wrong because people usually listen to you, use their intuition, and hopefully learn from their mistakes. AI can do this if you reflect on it and curate its memory, but it will often fail to do so. Instead I treat it as an implementation engine that needs mechanical, strict boundaries and examples.

Without such constraints, AI will take the path of least resistance. In the moment that feels fast. Over time it is usually the path of **most** resistance and can lead to project failure.

When those gates are in place, however, AI becomes a significant multiplier. Without them, it becomes a technical debt accelerator.

I still write way less code by hand than I ever have. But I am concentrating on the most important code: the boundaries, the harnesses, the checks, the tools, the patterns. That is where the experience goes now.
