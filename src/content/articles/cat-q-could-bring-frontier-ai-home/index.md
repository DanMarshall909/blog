---
title: "CAT-Q could bring frontier-class AI home"
author: Dan Marshall
date: "2026-07-15"
tags: ["AI", "local LLMs", "quantization", "ternary models", "BitNet", "CAT-Q"]
description: "CAT-Q suggests existing full-precision language models may be convertible into fast, compact ternary models without retraining them from scratch. If the results hold, large local AI systems could become dramatically more practical."
---

## The short version

A recent paper called [CAT-Q](https://arxiv.org/abs/2606.26650) may have removed one of the largest barriers to practical ternary language models.

Until now, the strongest 1.58-bit models generally needed to be trained that way from the beginning. That is interesting academically, but commercially awkward: training a capable large language model costs an absurd amount of money, and the industry already has a growing library of excellent full-precision models.

CAT-Q proposes a different route. Start with an existing pretrained model, then calibrate it into a ternary model whose weights are restricted to three values:

```text
-1, 0, +1
```

The process uses a little over one million calibration tokens in the paper's standard configuration, rather than retraining on hundreds of billions or trillions of tokens.

The important caveat is that the technique currently looks much better on large models than small ones. The quality loss is substantial at the low end, but it narrows considerably as model size increases. In practical terms, the most interesting territory appears to begin around 70 billion parameters.

That sounds backwards for local AI. It may not be.

## Why ternary models matter

Most modern language models store weights using 16-bit floating-point numbers during training. Consumer quantisations commonly reduce those weights to four bits for inference.

Ternary models go much further. They need only three possible weight values, corresponding to about 1.58 bits of information per weight.

Raw weight storage therefore falls by roughly ten times compared with FP16. Once scales, grouping metadata and alignment are included, a practical implementation may land closer to an eight-times reduction. Either way, the difference is enormous.

The compute also changes. A conventional matrix multiplication performs large numbers of floating-point multiplications. With ternary weights, multiplication by a weight becomes one of three operations:

```text
add the activation
subtract the activation
do nothing
```

Purpose-built kernels can replace much of the multiply-heavy workload with additions, sign changes and skips. This is why ternary models promise more than smaller files: they may also be much faster and more energy-efficient.

That promise is not automatic. Running ternary weights through kernels designed for conventional floating-point models leaves much of the advantage on the table. Runtimes such as `bitnet.cpp`, ternary support in `llama.cpp`, and eventually hardware designed for low-bit inference are essential parts of the story.

## CAT-Q changes the economics

The original BitNet result was exciting because it showed that a model could be trained natively with ternary weights without collapsing in quality.

The problem was the word *trained*.

If every useful ternary model has to be pretrained from scratch, adoption depends on organisations spending millions of dollars to recreate models that already exist. That sharply limits the number of architectures, sizes and specialisations available.

CAT-Q is significant because it is a post-training quantisation technique. The authors report converting pretrained models from 1.7B through 235B parameters rather than rebuilding them from zero.

Its two central ideas are:

- **Learnable modulation**, which reshapes weight distributions and adjusts ternary thresholds so the weights are less sensitive to conversion.
- **Softened ternarisation**, which gradually moves weights toward their final ternary values instead of immediately applying a destructive hard threshold.

The method reconstructs the behaviour of neighbouring layers over a calibration dataset, allowing layers to compensate for one another rather than quantising each one in isolation.

The result is still a conversion process rather than a free lunch. The paper used up to eight A100 80 GB GPUs and reported between eight and sixty hours for models from 14B to 235B. But that is tiny beside the cost of pretraining a comparable model.

If independently reproduced, this changes the question from:

> Who can afford to train a serious ternary model?

into:

> Which existing model should we convert?

That is a much more interesting question.

## Bigger models appear to survive better

The paper's results are not equally strong at every scale.

Small and medium models lost a noticeable amount of capability. The average benchmark score for Qwen3-8B fell by almost ten points after conversion. At 70B, the gap was much smaller.

That suggests model scale provides enough redundancy for aggressive ternarisation. A very large model can lose considerable numerical precision while retaining much of its learned structure. A small model has fewer spare degrees of freedom and less capacity to absorb the damage.

This matters because it reverses the usual local-model calculation.

Today, local AI typically means choosing the smallest model that remains useful because memory capacity is the dominant constraint. Ternary conversion could let us choose a much larger model precisely because its weights become so compact.

A 70B model stored in FP16 needs about 140 GB for weights alone. At an effective two bits per weight, including some overhead, the same weights could be in the vicinity of 18 GB. The KV cache, activations, runtime buffers and context length still matter, but the model is suddenly within reach of a high-end consumer GPU or a workstation with unified memory.

The more ambitious possibility is mixture-of-experts models.

## Could something like GLM-5.2 run locally?

GLM-5.2 is an unusually large open-weight mixture-of-experts model, reportedly around 744 billion total parameters. Running its full-precision weights locally is out of reach for ordinary users. Even conventional low-bit quantisations require workstation-class memory, and experimental systems that stream experts from storage are extraordinarily slow.

A successful ternary conversion would radically reduce the static weight footprint. In crude arithmetic:

```text
744 billion weights × 1.58 bits ≈ 147 GB
```

Practical group scales and metadata would push that higher, so this would not turn GLM-5.2 into a laptop model. It could, however, move it from a multi-server problem toward a large but attainable workstation problem.

Mixture-of-experts architecture provides another advantage: only a subset of experts is active for each token. A runtime capable of retaining frequently used experts in GPU memory while efficiently paging others from system memory could combine ternary storage with sparse execution.

That is not available as a polished consumer stack today. It requires several technologies to mature together:

```text
large open-weight model
        ↓
reliable CAT-Q-style conversion
        ↓
native ternary storage
        ↓
fast ternary CPU/GPU/NPU kernels
        ↓
MoE-aware memory placement and expert streaming
```

But none of these pieces is implausible. Some already exist in early form.

This is why CAT-Q is more important than another incremental quantisation paper. It potentially connects the enormous investment already made in full-precision models with a radically cheaper inference format.

## The uncomfortable caveat: reasoning did not survive cleanly

The paper's headline results focus on general language benchmarks, where CAT-Q compares favourably with ternary models trained from scratch.

Its published coding and mathematics results are much less reassuring.

The ordinary CAT-Q process caused severe collapse on benchmarks including HumanEval+, MBPP+ and MATH-500. In some reported cases, scores fell to zero.

The authors also report an improved calibration approach called CAT-Q+ that recovers much of this performance. However, the full method and implementation were not public when I wrote this.

That caveat is not minor. A model that retains conversational ability but loses coding, mathematics and structured reasoning is not a substitute for a frontier assistant.

It also points toward a likely research direction: calibration data is not merely a representative sample of language. It may need to actively preserve the behaviours we care about. A coding model may need calibration traces containing code generation, tool calls, test execution and iterative repair. A reasoning model may need worked mathematical and logical trajectories.

Post-training ternarisation may become less like file compression and more like capability-preserving distillation.

## What would make this a mainstream technology?

CAT-Q does not yet mean everyone can run a frontier model on a gaming PC. Several things still have to happen:

1. **Independent reproduction.** The results need to be repeated across architectures, datasets and evaluation suites.
2. **The official implementation.** The [BitTern repository](https://github.com/IntelChina-AI/BitTern) exists, but the complete CAT-Q release was still pending when this article was written.
3. **Capability-preserving calibration.** Coding, mathematics, tool use and long-context behaviour must survive conversion.
4. **Mature runtimes.** Ternary kernels need broad CPU, GPU and NPU support rather than isolated research implementations.
5. **Honest end-to-end benchmarks.** Model size alone is insufficient. We need prompt-processing speed, generation speed, KV-cache consumption, energy use and quality measured together.
6. **Hardware support.** The largest gains will arrive when consumer NPUs and GPUs can execute ternary arithmetic without repeatedly dequantising weights.

The likely progression is not that ternary models replace everything overnight. It is that they become another deployment target alongside FP16, INT8 and four-bit GGUF models.

Once the toolchain is routine, model publishers could release several variants:

```text
training checkpoint: BF16
server inference: FP8 / INT8
consumer GPU: INT4
edge and local appliance: ternary
```

At that point, local AI starts looking less like a hobbyist compromise and more like a normal product architecture.

## Why this could propel local AI into the mainstream

Cloud AI is convenient, but its economics and limitations are structural:

- ongoing token charges
- network latency
- service outages and rate limits
- privacy and data-governance concerns
- models changing underneath applications
- dependency on a vendor's continued support

Local inference removes or reduces each of those problems. Its main disadvantage has been hardware cost.

If a capable 70B model can run comfortably on a consumer workstation, small businesses can own their inference stack. Software products can ship with private assistants. Families can run persistent AI systems without sending every interaction to a cloud provider. Developers can build agents whose marginal token cost is effectively electricity.

If frontier-scale mixture-of-experts models can eventually run on a machine costing a few thousand dollars rather than infrastructure costing tens or hundreds of thousands, the consequences are larger still.

CAT-Q has not proved that future yet. Its results include serious weaknesses, its implementation is incomplete, and the strongest claims need independent validation.

But it offers a credible route that did not previously exist:

> Take the best large models we already have, convert them rather than retraining them, and deploy them using a fraction of the memory and compute.

If that route works reliably—especially for 70B and larger models—ternary inference may be the technology that finally moves powerful local language models from enthusiast hardware into ordinary homes and businesses.
