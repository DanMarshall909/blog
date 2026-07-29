---
title: "CAT-Q Just Became Real—but Not Yet Practical"
author: Dan Marshall
date: "2026-07-29"
tags: ["ai", "llm", "ternary", "quantization", "local-ai"]
description: "Intel’s CAT-Q release is strong evidence that existing language models can be converted to ternary weights without retraining from scratch. It is an important milestone, but the efficient runtime needed to transform local AI is still missing."
template: article.pug
---

The most interesting development in local language models this month is not another benchmark-leading model.

It is the release of the first usable artefacts for [CAT-Q](https://github.com/IntelChina-AI/BitTern/tree/main/projects/cat-q), Intel’s method for converting existing pretrained language models into ternary models through post-training quantisation.

On 22 July 2026, Intel released CAT-Q model checkpoints, inference code and evaluation code. The accompanying model zoo includes Qwen3 models from 1.7B to 32B parameters, as well as mixture-of-experts models up to Qwen3-235B-A22B.

That matters because CAT-Q attacks one of the largest obstacles facing ternary language models: the cost of creating them.

However, it is also easy to overstate what has been released. CAT-Q has moved from an interesting paper to something that can be independently evaluated. It has not yet produced a practical, packed runtime that lets us run a 32B model in roughly 6 GB of VRAM.

Both parts of that statement matter.

---

## Why Ternary Models Matter

Most language models store each weight using 16-bit floating-point values during normal inference, or reduce them to formats such as 8-bit or 4-bit integers for local deployment.

A ternary model restricts each weight to three possible values, commonly represented conceptually as `-1`, `0` and `1`. That requires about 1.58 bits of information per weight in the ideal case.

For a 32-billion-parameter model, the theoretical raw weight storage is therefore approximately:

```text
32 billion × 1.58 bits ≈ 6.32 GB
```

That figure excludes scales, metadata, embeddings, activation memory and the key-value cache. It is not a realistic total VRAM requirement by itself. It does, however, show why ternary models are so interesting.

Compared with FP16, the theoretical weight representation is around ten times smaller. Compared with a 4-bit quantised model, it is still roughly two and a half times smaller.

More importantly, ternary arithmetic has the potential to replace much of the expensive multiplication used during inference with simpler operations. A properly designed runtime could therefore improve memory bandwidth, power consumption and generation speed—not merely reduce the model file size.

The problem is that achieving those gains normally requires training the model specifically for ternary weights.

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

The released checkpoints also weaken the idea that this approach is useful only for extremely large models. Intel has supplied CAT-Q parameters for:

- Qwen3-1.7B
- Qwen3-4B
- Qwen3-8B
- Qwen3-14B
- Qwen3-32B
- Qwen3-30B-A3B
- Qwen3-235B-A22B
- Llama 2 7B

The method spans small dense models, larger dense models and large mixture-of-experts architectures.

That does not mean quality loss is identical at every scale. Larger models may retain capability more gracefully because they begin with greater redundancy. It does mean CAT-Q is not merely a specialised demonstration on one enormous model.

---

## Why the Latest Release Is Important

Before this release, CAT-Q was primarily a paper with promising results.

The new release supplies model checkpoints, inference code and evaluation code. Researchers and developers can now reproduce the evaluation process, inspect the implementation and compare the published results against the released artefacts.

That is a meaningful credibility milestone.

The release also covers modern Qwen3 architectures rather than relying only on an older academic baseline. Qwen3-32B is particularly interesting for local inference because its theoretical packed ternary weight size falls within the broad range of consumer GPUs.

Qwen3-30B-A3B may be even more interesting. As a mixture-of-experts model, it contains approximately 30B total parameters but activates only around 3B parameters for each token. A packed ternary representation could reduce storage and memory bandwidth, while the sparse architecture reduces the amount of computation required per token.

Those are exactly the characteristics required for capable local AI: substantial model capacity, lower active compute and dramatically reduced weight storage.

But the word *could* is doing considerable work here.

---

## The Released Models Are Not Packed Ternary Models

The CAT-Q export process currently restores the model into a Hugging Face-compatible architecture using fake-quantised floating-point weights.

The project explicitly states that the exported model is **not a packed ternary checkpoint**.

This means the current export does not realise the theoretical storage advantage of 1.58-bit weights. It also does not automatically provide fast ternary arithmetic on a consumer GPU.

You cannot currently export Qwen3-32B, load a roughly 6 GB file into llama.cpp and receive an order-of-magnitude improvement in performance.

The release is suitable for:

- evaluating whether the quantised model retains accuracy;
- reproducing the paper’s benchmark process;
- examining CAT-Q’s quantisation parameters;
- experimenting with the restored model through conventional frameworks;
- providing source material for future runtime integration.

It is not yet a consumer-ready ternary inference stack.

This distinction is important because model compression papers frequently report theoretical bit widths without delivering an end-to-end implementation that stores, loads and executes those weights efficiently.

A 1.58-bit model represented internally using floating-point tensors is a quantisation experiment, not a 1.58-bit deployment.

---

## The Conversion Code Is Still Missing

The second major limitation is that Intel has not yet released the CAT-Q training code.

In this context, “training” refers to the calibration and optimisation process used to derive the ternary quantisation parameters. The released repository can evaluate the supplied checkpoints, but it does not yet provide the complete official process for converting an arbitrary model.

That means we cannot currently take a preferred coding model, a specialised fine-tune or a newer GLM-family model and run it through the official CAT-Q pipeline ourselves.

The project says that this code is being prepared for release.

Until it arrives, the most strategically important claim—cheap conversion of the wider model ecosystem—cannot be explored independently beyond the models Intel has selected.

---

## What Still Needs to Happen

CAT-Q has made the model-quality problem look substantially more tractable. The remaining barriers are largely systems-engineering problems.

For CAT-Q to transform local inference, the ecosystem still needs:

1. The complete model-conversion code.
2. A defined packed format for ternary weights and associated scales.
3. Efficient CPU kernels using bit packing and vector instructions.
4. Efficient GPU kernels designed for ternary operations.
5. Integration with practical runtimes such as llama.cpp, vLLM or SGLang.
6. End-to-end benchmarks covering model size, VRAM usage, prompt processing, generation speed and power consumption.

The kernels are the difficult part.

Modern GPUs are extremely good at performing operations in formats such as FP16, BF16, FP8 and INT8 because the hardware is explicitly designed for them. A theoretically simpler representation does not automatically outperform highly optimised tensor cores.

A ternary runtime must pack values densely, unpack them cheaply, apply scaling efficiently and keep the hardware occupied. Otherwise, the cost of translating the representation may consume much of the expected gain.

CPU inference may initially benefit more clearly because memory bandwidth is often the dominant bottleneck and commodity CPUs already expose useful bitwise and vector operations. GPU inference could ultimately be faster, but it will require specialised kernels rather than a superficial file-format conversion.

---

## What This Could Mean for Local AI

If the remaining engineering work succeeds, CAT-Q could materially change the hardware required to run capable models locally.

A 30B-class model that currently requires a large GPU, aggressive offloading or slow CPU inference might fit into the memory available on an ordinary gaming system. Models in the 70B range could become practical on high-end consumer hardware rather than workstation-class configurations.

Mixture-of-experts models are particularly compelling. A model can retain a large total parameter count for knowledge capacity while activating only a fraction of those parameters for each token. Combine that with packed ternary weights and local inference begins to look less like a niche hobby and more like a plausible consumer workload.

That would have consequences beyond avoiding API fees.

Local models offer better privacy, predictable availability, lower latency for interactive applications and the ability to customise systems without sending sensitive context to an external provider. They also make AI applications less dependent on the commercial decisions of a small number of model hosts.

The limiting factor has consistently been the gap between models that are small enough to run locally and models that are capable enough to replace cloud services for serious work.

CAT-Q may help close that gap.

---

## A Significant Milestone, Not the Finish Line

The latest CAT-Q release should be taken seriously.

Intel has published checkpoints and evaluation tooling for real model families ranging from 1.7B dense models to a 235B mixture-of-experts model. The project provides strong evidence that accurate ternarisation can be applied after pretraining using a comparatively tiny calibration dataset.

That is a much more useful result than proving that ternary models work only when trained from scratch.

However, the current release does not yet provide the thing local-AI users actually need: a packed model running through an efficient, accessible inference engine.

The sensible conclusion is neither dismissal nor hype.

CAT-Q has reduced one of the largest scientific uncertainties around ternary language models. It suggests that existing models can be converted without repeating their full training process, and that the technique can scale across dense and mixture-of-experts architectures.

The remaining question is whether the runtime ecosystem can turn those ternary weights into real reductions in memory, cost and latency.

If it can, this may be one of the technologies that moves capable local language models into the mainstream.

For now, CAT-Q is evidence that the destination is plausible—not evidence that we have arrived.