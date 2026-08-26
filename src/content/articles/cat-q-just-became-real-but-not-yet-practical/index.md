---
title: "CAT-Q Just Became Real—but Not Yet Practical"
author: Dan Marshall
date: "2026-08-27"
tags: ["ai", "llm", "ternary", "quantization", "local-ai"]
description: "Intel’s CAT-Q release suggests existing language models—even a 235B mixture-of-experts model—can be converted toward ternary weights without retraining from scratch. The model-quality result is increasingly credible; the missing piece is a genuinely packed, ternary-native runtime."
template: article.pug
---

The most interesting development in local language models is not another benchmark-leading model.

It is the release of usable artefacts for [CAT-Q](https://github.com/IntelChina-AI/BitTern/tree/main/projects/cat-q), Intel’s method for converting existing pretrained language models into ternary models through post-training quantisation.

On 22 July 2026, Intel released CAT-Q model checkpoints, inference code and evaluation code. The accompanying model zoo includes Qwen3 models from 1.7B to 32B parameters, mixture-of-experts models such as Qwen3-30B-A3B, and—most interestingly—Qwen3-235B-A22B.

That last model changes the scale of the conversation.

CAT-Q is no longer merely interesting because it hints that a 30B model might fit on a gaming PC. It raises the possibility that models with *hundreds of billions of total parameters* could eventually fit into machines with tens rather than hundreds of gigabytes of model memory.

That matters because CAT-Q attacks one of the largest obstacles facing ternary language models: the cost of creating them.

However, it is also easy to overstate what has been released. CAT-Q has moved from an interesting paper to something that can be independently evaluated. It has **not** yet produced a practical packed runtime that stores and executes those models at their theoretical ternary size.

Both parts of that statement matter.

---

## Why Ternary Models Matter

Most language models store each weight using 16-bit floating-point values during normal inference, or reduce them to formats such as 8-bit or 4-bit integers for local deployment.

A ternary model restricts each weight to three possible values, commonly represented conceptually as `-1`, `0` and `1`. Three states contain about 1.58 bits of information per weight in the ideal information-theoretic case.

For a 32-billion-parameter model, the theoretical raw weight storage is therefore approximately:

```text
32 billion × 1.58 bits ≈ 6.3 GB
```

For a 235-billion-parameter model:

```text
235 billion × 1.58 bits ≈ 46 GB
```

Those figures are theoretical raw information content. Real formats need packing, scales, metadata and sometimes unquantised tensors. A simple two-bit representation of 235B ternary values would already require about 59 GB before overhead.

So I would not claim that Qwen3-235B-A22B is a 46 GB model waiting to be downloaded. A practical packed representation might plausibly land somewhere around the 60–65 GB range depending on how it is encoded, but that is an engineering estimate, not something Intel currently ships.

Even so, compare that with FP16:

```text
235 billion × 16 bits ≈ 470 GB
```

That is the attraction. Ternary weights potentially move models whose raw FP16 weights belong in multi-GPU servers into the memory capacity of a single high-memory accelerator or unified-memory workstation.

More importantly, ternary arithmetic has the potential to replace many multiply operations with simpler add, subtract or skip operations. A properly designed runtime could therefore improve memory bandwidth, power consumption and generation speed—not merely reduce the model file size.

The difficult phrase there is **properly designed runtime**.

---

## The Expensive Way: Train a Ternary Model

Projects such as BitNet have demonstrated that useful language models can be trained using ternary weights. The catch is that training a capable foundation model requires enormous datasets and significant compute.

That leaves ternary models with an awkward adoption problem.

The organisations capable of training strong models from scratch already have mature GPU infrastructure and heavily optimised conventional inference stacks. Smaller organisations and local-AI developers, who would benefit most from dramatically lower hardware requirements, generally cannot afford to train a competitive foundation model.

A technique that works only when a model is trained from the beginning in ternary form is scientifically interesting, but difficult to apply to the existing model ecosystem.

CAT-Q takes a different approach.

---

## CAT-Q Converts Existing Models

CAT-Q applies post-training quantisation to an already pretrained model. It uses a small calibration dataset to adapt the model’s weight distribution, reconstruction scale and ternary thresholds, then progressively moves toward hard ternarisation.

According to the project, CAT-Q uses only 512 calibration samples. For models between 1.7B and 8B parameters, that represents roughly one million calibration tokens, while remaining competitive with ternary model families trained using between 100 billion and one trillion tokens.

That is the central result.

It suggests that we may not need to train every useful ternary model from scratch. Instead, a strong full-precision model could potentially become the source material for a much smaller ternary version.

This changes the economics considerably.

Rather than waiting for a well-funded laboratory to reproduce every interesting architecture as a native ternary model, it may eventually be possible to apply the technique to existing models and fine-tunes.

Intel has supplied CAT-Q parameters for:

- Qwen3-1.7B
- Qwen3-4B
- Qwen3-8B
- Qwen3-14B
- Qwen3-32B
- Qwen3-30B-A3B
- Qwen3-235B-A22B
- Llama 2 7B

The method spans small dense models, larger dense models and very large mixture-of-experts architectures.

That does not mean quality loss is identical at every scale. Larger models may retain capability more gracefully because they begin with greater redundancy. It does mean CAT-Q is not merely a specialised demonstration on one convenient model.

The bigger implication is architectural: **ternary may become a deployment target for mainstream pretrained models rather than a property that has to be baked in from the start.**

That is a much more important proposition.

---

## The 235B Example Is Where This Gets Interesting

Qwen3-235B-A22B is a mixture-of-experts model. It has roughly 235B total parameters, but only around 22B are active for a token.

Those two numbers matter for different reasons.

The **235B total parameters** determine how much model state must generally be stored somewhere. The **22B active parameters** reduce the amount of expert computation needed for each token compared with a dense 235B model.

Ternary quantisation attacks the first problem. MoE sparsity attacks the second.

Together, they point toward a very different hardware envelope.

A theoretical 1.58-bit representation of 235B weights is about 46 GB. A more straightforward two-bit packing is about 59 GB before overhead. Allow room for scales, metadata, non-ternary tensors and runtime structures and a practical packed model could plausibly be in the neighbourhood of 60–65 GB.

That is not consumer-GPU territory in the conventional 8–24 GB sense, but it **is** within the capacity of hardware that would normally look absurdly small for a 235B model:

- 80 GB-class accelerators;
- 96–128 GB unified-memory workstations;
- sufficiently large CPU memory systems, assuming bandwidth is adequate;
- potentially multi-device consumer systems with efficient weight placement.

A 128 GB unified-memory machine could, in capacity terms, have enough room for such a packed model plus a meaningful amount of runtime state and KV cache. An 80 GB accelerator might also have enough capacity if the packed representation and runtime overhead are controlled carefully.

That does **not** mean either machine would run it quickly today.

MoE models still need to route tokens to experts and move or access the relevant expert weights efficiently. Memory bandwidth, expert layout, cache behaviour, kernel quality and prompt-processing cost all matter. A model fitting in memory is a necessary condition, not a performance benchmark.

But fitting is the first barrier—and ternary weights could move that barrier dramatically.

This is why the 235B checkpoint is more consequential than the 32B one. It changes the question from:

> Can I squeeze a somewhat larger local model onto a gaming machine?

into:

> Could datacentre-scale model capacity become runnable on a single high-memory workstation?

That is a much more disruptive possibility.

---

## Why the Latest Release Is Important

Before this release, CAT-Q was primarily a paper with promising results.

The release supplies model checkpoints, inference code and evaluation code. Researchers and developers can now reproduce the evaluation process, inspect the implementation and compare published results against released artefacts.

That is a meaningful credibility milestone.

The release also covers modern Qwen3 architectures rather than relying only on an older academic baseline. Qwen3-32B is interesting because its theoretical packed ternary weight size falls into consumer-GPU territory. Qwen3-30B-A3B combines a large total model with only around 3B active parameters per token.

But Qwen3-235B-A22B is the model that makes the broader thesis difficult to ignore.

If a model of that size can retain useful quality after post-training ternarisation, then ternary inference stops being merely a technique for making small models smaller. It begins to look like a possible route for collapsing the memory requirements of genuinely large models.

But the word *possible* is doing considerable work here.

---

## The Released Models Are Not Packed Ternary Models

The CAT-Q export process currently restores the model into a Hugging Face-compatible architecture using fake-quantised floating-point weights.

The project explicitly states that the exported model is **not a packed ternary checkpoint**.

This means the current export does not realise the theoretical storage advantage of 1.58-bit weights. It also does not automatically provide fast ternary arithmetic on a consumer GPU.

You cannot currently export Qwen3-235B-A22B, obtain a roughly 60 GB production checkpoint, load it onto an 80 GB GPU and suddenly have a fast 235B local model.

Likewise, you cannot export Qwen3-32B, load a roughly 6 GB file into llama.cpp and receive an order-of-magnitude improvement in performance.

The release is suitable for:

- evaluating whether the quantised model retains accuracy;
- reproducing the paper’s benchmark process;
- examining CAT-Q’s quantisation parameters;
- experimenting with the restored model through conventional frameworks;
- providing source material for future runtime integration.

It is not yet a consumer-ready ternary inference stack.

This distinction is important because model compression papers frequently report theoretical bit widths without delivering an end-to-end implementation that stores, loads and executes those weights efficiently.

A 1.58-bit model represented internally using floating-point tensors is a quantisation result, not a 1.58-bit deployment.

---

## The Conversion Code Is Still Missing

The second major limitation is that Intel has not yet released the CAT-Q training code.

In this context, “training” refers to the calibration and optimisation process used to derive the ternary quantisation parameters. The released repository can evaluate the supplied checkpoints, but it does not yet provide the complete official process for converting an arbitrary model.

That means we cannot currently take a preferred coding model, a specialised fine-tune, GLM or whatever strong architecture appears next and run it through the official CAT-Q pipeline ourselves.

The project says that this code is being prepared for release.

Until it arrives, the most strategically important claim—cheap conversion of the wider model ecosystem—cannot be explored independently beyond the models Intel has selected.

---

## The Runtime May Be the Bigger Breakthrough

The model-quality result is starting to look credible. The next question is whether we are thinking about the runtime correctly.

It would be easy to treat ternary as simply another quantisation type: add a new packed format to an existing inference engine, unpack the weights into conventional values, then feed them through roughly the same matrix-multiplication machinery.

That may work, but it risks throwing away much of what makes ternary interesting.

A ternary weight is not merely a very small integer. Conceptually, its operation is:

```text
-1  -> subtract
 0  -> skip
+1  -> add
```

That suggests an execution model built around the properties of ternary weights themselves: dense packing, zero skipping, add/subtract accumulation, vectorised bit operations, sparse expert activation and carefully fused scaling.

Research directions such as FairyFuse are interesting in this context because they point toward treating low-bit and ternary execution as a systems problem rather than merely a storage format.

The eventual stack could look something like:

```text
mainstream pretrained model
        ↓
CAT-Q-style conversion
        ↓
packed ternary representation
        ↓
ternary-aware compiler/runtime
        ↓
CPU / GPU / unified-memory hardware
```

The important thing is that the first box does not need to be a specially trained ternary foundation model.

If that proves true, the runtime may become the differentiating technology.

---

## What Still Needs to Happen

CAT-Q has made the model-quality problem look substantially more tractable. The remaining barriers are largely systems-engineering problems.

For CAT-Q to transform local inference, the ecosystem still needs:

1. The complete model-conversion code.
2. A defined packed format for ternary weights and associated scales.
3. Efficient CPU kernels using dense packing, bit operations and vector instructions.
4. Efficient GPU kernels designed specifically around ternary execution.
5. MoE-aware expert placement and routing that avoids turning sparse compute into a memory-transfer bottleneck.
6. Integration with practical runtimes such as llama.cpp, vLLM or SGLang—or perhaps a purpose-built ternary runtime.
7. End-to-end benchmarks covering model size, RAM/VRAM usage, prompt processing, generation speed, bandwidth and power consumption.

The kernels and memory movement are the difficult parts.

Modern GPUs are extremely good at performing operations in formats such as FP16, BF16, FP8 and INT8 because the hardware is explicitly designed for them. A theoretically simpler representation does not automatically outperform highly optimised tensor cores.

A ternary runtime must pack values densely, decode or operate on them cheaply, apply scaling efficiently and keep the hardware occupied. For MoE models, it must also make the right experts available without spending all of its time moving weights around.

Otherwise, the cost of translating the representation may consume much of the expected gain.

CPU and unified-memory inference may initially be particularly interesting because memory capacity and bandwidth are often the limiting factors, and commodity processors expose useful bitwise and vector operations. GPU inference could ultimately be much faster, but it will require specialised kernels rather than a superficial file-format conversion.

---

## What This Could Mean for Local AI

If the remaining engineering work succeeds, CAT-Q could materially change what the phrase *local model* means.

A 30B-class model that currently requires a large GPU, aggressive offloading or slow CPU inference might fit into the memory available on an ordinary gaming system.

A 70B-class model could become practical on high-end consumer or unified-memory hardware.

And a 235B mixture-of-experts model could move from a multi-GPU datacentre workload into the capacity range of a single 80–128 GB machine.

That last claim deserves care: **capacity range is not the same thing as practical performance**. There is still a large gap between “the weights fit” and “this is pleasant to use”.

But that gap is an engineering problem we know how to attack.

The more fundamental problem was whether converting an already capable model to ternary weights would destroy too much of its ability. CAT-Q provides increasingly strong evidence that it may not.

That would have consequences beyond avoiding API fees.

Local models offer better privacy, predictable availability, lower latency for interactive applications and the ability to customise systems without sending sensitive context to an external provider. They also make AI applications less dependent on the commercial decisions of a small number of model hosts.

The limiting factor has consistently been the gap between models that are small enough to run locally and models that are capable enough to replace cloud services for serious work.

CAT-Q, MoE architectures and ternary-native runtimes could attack that gap from three directions at once.

---

## A Significant Milestone, Not the Finish Line

The latest CAT-Q release should be taken seriously.

Intel has published checkpoints and evaluation tooling for real model families ranging from 1.7B dense models to Qwen3-235B-A22B. The project provides strong evidence that accurate ternarisation can be applied after pretraining using a comparatively tiny calibration dataset.

That is a much more useful result than proving that ternary models work only when trained from scratch.

The strategically important idea is not simply that ternary models can be small.

It is that **ternary may become a post-training deployment target for whichever mainstream models turn out to be good**.

If that happens, we do not need to wait for a separate ternary ecosystem to catch up with every new model generation. In principle, the pipeline becomes:

```text
Qwen / GLM / DeepSeek / whatever comes next
                    ↓
             CAT-Q-style conversion
                    ↓
          packed ternary representation
                    ↓
            ternary-native runtime
                    ↓
              local hardware
```

The current CAT-Q release proves only part of that chain.

It does not yet provide the packed checkpoint format, the arbitrary-model conversion tooling, or the runtime capable of turning ternary weights into their full memory and compute advantage.

But the 235B result makes the potential payoff much clearer.

If the systems work follows the model research, we may reach a point where machines with tens of gigabytes of memory can run models whose full-precision ancestors required hundreds.

That is the point where ternary inference stops being an interesting quantisation trick and starts looking like a change in the economics of local AI.

For now, CAT-Q is evidence that the destination is plausible—not evidence that we have arrived.
