# Forcing AI to Write Good Code (Whether It Likes It or Not): Introducing Flo

So I’ve been building this thing for a few weeks now—a tool called **Flo** (technically `WorkFlo`, but that name’s temporary and already annoying me). It’s a **TDD workflow engine** designed not just for you and me, but for AI agents too. And by “designed,” I really mean **“designed to constrain”**—because left to their own devices, coding agents like Claude and Gemini write code like overconfident junior devs on a sugar high.

They invent their own implementations, write fragile tests afterwards (if any), and ignore detailed instructions the moment you give them a new thought to chew on. Sound familiar?

## What Is Flo?

Flo is part CLI, part VS Code extension, and all about enforcing **strict, disciplined, test-first development**—with **hard stops** at every stage. It’s like putting a GPS collar on your AI and saying, “Nope, we’re not moving to implementation until we write a failing test first.”

The core idea is simple: **RED → GREEN → REFACTOR → COVER → NEXT**, one step at a time. No skipping. No freelancing. No "just quickly adding this other thing while I’m here."

And yes, that applies to humans too.

### Highlights

- ✅ Works with basically any project type: web, mobile, CLI, libraries, etc.
- 🧱 Built-in **GitHub integration** (issues, boards, PRs, labels).
- 🧩 Seamless **VS Code extension** with real-time TDD status.
- 🔒 Opinionated AF: no multitasking, no cutting corners.
- 🔧 Extensible if you hate the opinions but love the framework.

## Why I Built It

The motivation was simple: **AI doesn’t follow process unless you make it**. And I was sick of cleaning up after it.

I’ve tried to use memory, detailed prompting, external systems—you name it—to get Claude and Gemini to respect the test-first workflow. They just... don’t. Claude’s okay-ish. Gemini’s like a toddler in a tool shed. They’ll happily write 500 lines of code based on an imaginary spec and then forget to check whether it compiles.

So instead of wrangling, I decided to build a fence: Flo. It runs **from the command line**, works **project-wide**, and literally **blocks progress until the required TDD phase is complete**.

AI or human, if you haven’t written a failing test yet, you’re not moving forward. Sorry.

## How It Works

Start with:

```bash
flo start <issue-number>
```

Then work through the phases:

```bash
flo red        # Write a failing test
flo green      # Make it pass, minimally
flo refactor   # Clean it up
flo cover      # Add more tests
flo next       # Move to the next acceptance criterion
```

That last one—`next`—is a **hard stop**. You literally cannot continue without declaring you're done with the current acceptance criterion. This prevents scope creep, forces focus, and keeps your dev process tight.

I know, I know. Friction. But *deliberate* friction. The good kind. Like brake pads on a race car.

## Naming Tests Properly (No, Really)

Quick detour: I *hate* GIVEN-WHEN-THEN test names. They’re wordy, hard to parse, and no one follows the format anyway.

Instead, I follow [this naming convention](https://enterprisecraftsmanship.com/posts/you-naming-tests-wrong/) which recommends **descriptive, plain-English test names** like:

```csharp
passes_a_test_when_she_has_a_grade_higher_than_50_percent
```

Still readable. Still expressive. Much easier to grep, and they fail loud and clear in the console. That said, I do include `[Trait("Given", "...")]` and so on, for cucumber fans who like grouping things in their test runner. Best of both worlds.

## Multi-Language, Multi-Agent Chaos

So far, I’ve built versions of Flo in:

- **Bash**
- **TypeScript**
- **C#**
- And now: **F#** (current favorite)

Why so many? Because I was experimenting with different AIs and different language ergonomics. And also because I had a good BATS test suite early on, which meant I could confidently ask the AI to **port the whole thing** to another language and verify it didn’t break anything.

Each version taught me something. F# especially surprised me—it’s lean, expressive, and Claude writes it surprisingly well. Bash was... functional. C# was familiar but verbose. TypeScript was fast but got messy quick.

## The Cool Bit: Dogfooding Flo With Flo

Here’s where it gets ultra-nerdy: I’m using Flo **to build Flo**.

That’s right. The AI follows the TDD cycle enforced by the very tool it's helping implement. Tests first. One acceptance criterion at a time. Hard stops. Refactor only in the refactor phase. It’s like training your AI on a leash made of tests and command-line guards.

Honestly? It's been wild. Sometimes frustrating, sometimes magical. But the **velocity and quality** I’m getting out of this pattern is like nothing I’ve ever seen. The AI is still a bit of a raccoon with a keyboard, but at least now it’s *my* raccoon, and it’s learning to follow the rules.

## Try It (or Break It)

If any of this sounds like something you’d use—or you just want to try breaking a nerd’s pet project—check out the repo:  
👉 [https://github.com/DanMarshall909/WorkFlo](https://github.com/DanMarshall909/WorkFlo)

I’d love feedback, ideas, bug reports, PRs, rage-tweets, or just someone saying “why tho?”

Still very much a work in progress. Still building features. Still thinking of better names. But it works, and it’s changing the way I code.

AI coding isn't going away. Might as well teach it to write tests.
