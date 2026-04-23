---
title: "Running a 1-Bit LLM on Windows — Bonsai 8B Setup Guide"
author: Dan Marshall
date: "2026-04-06"
tags: ["AI", "LLM", "local AI", "BitNet", "Bonsai", "llama.cpp", "Windows", "CUDA"]
description: "An 8B LLM running at 180+ tokens/sec on a laptop GPU using just 1.1 GB of VRAM — complete walkthrough for Bonsai 8B on Windows with CUDA."
template: article.pug
heroImage: /articles/1bit-llm/cartoon.png
---

An 8B model that runs at 180+ tokens/sec on a laptop GPU using just 1.1 GB of VRAM. That's not a future promise — this is what 1-bit quantisation actually delivers today.

This post covers what 1-bit LLMs are, why they're different from regular quantised models, and a complete walkthrough for getting the **Bonsai 8B** model running on Windows with an NVIDIA GPU.

---

## What is a 1-bit LLM?

Most LLMs store their weights as 16-bit or 32-bit floating-point numbers. Quantisation (Q4, Q8, etc.) compresses these to smaller integer representations, trading some accuracy for smaller file sizes. A Q4 model is roughly half the size of its FP16 equivalent.

**1-bit models take this to the extreme.** Each weight is represented using just a single bit — effectively `-1`, `0`, or `+1`. The [BitNet paper (2023)](https://arxiv.org/abs/2310.11453) from Microsoft Research proposed this architecture and showed it could theoretically match full-precision accuracy if the model is **trained from scratch** with 1-bit weights rather than compressed after training.

That last part is the key distinction:

> 1-bit models are not compressed versions of existing models. They are entirely new models trained differently from the ground up.

This means you can't just take Llama 3 and "1-bit quantise" it. You need a model purpose-built for this architecture — which is why it took years for any commercially viable 1-bit model to appear.

---

## Why does this matter?

The memory savings are extraordinary. Consider the Bonsai 8B model:

| Format | File size | VRAM needed |
|---|---|---|
| FP16 (full precision) | ~16.3 GB | ~16+ GB |
| Q4_K_M (standard quant) | ~4.9 GB | ~5–6 GB |
| **Bonsai 1-bit** | **1.16 GB** | **~1.1 GB** |

That's a 14× reduction from FP16 — and with **no meaningful accuracy loss** compared to a standard 8B model, because the intelligence comes from the architecture, not from precision.

The other win is speed. Because the weight operations reduce to simple additions rather than floating-point multiplications, the CPU and GPU can process tokens significantly faster. On an RTX 5080, Bonsai 8B generates around **181 tokens/sec** — roughly 3–4× faster than a typical Q4 8B model.

For context: combine this with KV cache compression techniques like [TurboQuant](https://arxiv.org/abs/2404.03382) and you could theoretically run a **27B-class model with a 32K context window in under 4 GB of RAM**. That changes what's possible on consumer hardware entirely.

---

## Enter Bonsai — the first viable 1-bit models

In early 2025, [PrismML](https://prism-ml.com/) released **Bonsai** — the first commercially usable 1-bit LLMs. Three sizes are available:

| Model | Size | Best for |
|---|---|---|
| [Bonsai-1.7B](https://huggingface.co/prism-ml/Bonsai-1.7B-gguf) | ~300 MB | Mobile / very constrained hardware |
| [Bonsai-4B](https://huggingface.co/prism-ml/Bonsai-4B-gguf) | ~600 MB | Mid-range, up to ~130 tok/sec on M4 Pro |
| [Bonsai-8B](https://huggingface.co/prism-ml/Bonsai-8B-gguf) | 1.16 GB | Recommended for laptop/desktop |

All three ship in GGUF format (and Apple MLX format for Mac). They support a **65,536-token context window** — far larger than most small models. Tool calling works well, and in practice the 8B feels closer to a 13B model in capability.

One important caveat: **these models are proprietary**. They are not open-weight. If that matters to you, the Microsoft BitNet repo has open models (up to 8B) but they are undertrained and not currently production-quality.

---

## The catch — you need a special llama.cpp fork

Standard `llama.cpp` will refuse to load a Bonsai GGUF with an `invalid ggml type` error. Bonsai uses a custom quantisation type (`Q1_0_g128`) that requires dedicated CUDA kernels not yet in the upstream release.

PrismML maintain their own fork of llama.cpp with these kernels included:

**[github.com/PrismML-Eng/llama.cpp](https://github.com/PrismML-Eng/llama.cpp)**

Prebuilt Windows binaries are on the releases page — no compiling required.

> **Tip:** The fork does lag behind upstream llama.cpp. This means some newer features (like certain samplers or multimodal support) may not be available. For pure text inference it's fine.

---

## Setup on Windows (NVIDIA GPU)

### Prerequisites

- Windows 10 or 11
- NVIDIA GPU with CUDA 12.4 or 13.1 drivers installed
- ~3 GB free disk space

### Step 1 — Create the install folder

```
mkdir C:\1bitllm
mkdir C:\1bitllm\bin
mkdir C:\1bitllm\models
```

### Step 2 — Download the PrismML llama.cpp binaries

Go to the [PrismML llama.cpp releases page](https://github.com/PrismML-Eng/llama.cpp/releases) and download two zip files matching your CUDA version:

- `llama-prism-b1-f5dda72-bin-win-cuda-13.1-x64.zip`
- `cudart-llama-bin-win-cuda-13.1-x64.zip`

Extract both into `C:\1bitllm\bin\`. The folder should contain `llama-server.exe`, `llama-cli.exe`, and several `.dll` files including `ggml-cuda.dll`.

> **CUDA version tip:** Check your driver version with `nvidia-smi`. CUDA 13.1 requires driver 570+. If you're on an older driver, download the CUDA 12.4 variants instead.

### Step 3 — Download the Bonsai model

From [huggingface.co/prism-ml/Bonsai-8B-gguf](https://huggingface.co/prism-ml/Bonsai-8B-gguf), download `Bonsai-8B.gguf` (1.16 GB) and save it to `C:\1bitllm\models\`.

You can also use the Hugging Face CLI:

```
pip install huggingface_hub
huggingface-cli download prism-ml/Bonsai-8B-gguf Bonsai-8B.gguf --local-dir C:\1bitllm\models
```

### Step 4 — Start the server

Open a terminal in `C:\1bitllm\bin\` and run:

```
llama-server.exe -m ..\models\Bonsai-8B.gguf -ngl 99 --ctx-size 65536 --port 8080
```

Flag breakdown:

| Flag | What it does |
|---|---|
| `-ngl 99` | Offload all layers to GPU. Remove this for CPU-only. |
| `--ctx-size 65536` | Enable the full 65K context window |
| `--port 8080` | Port for the built-in web UI and OpenAI-compatible API |

Wait for:
```
main: server is listening on http://127.0.0.1:8080
```

### Step 5 — Test it

Open `http://localhost:8080` in your browser. You'll get a basic chat UI.

Or test the API directly (it's OpenAI-compatible):

```bash
curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{\"model\":\"bonsai\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'
```

---

## Automated install script

If you'd rather script the whole thing, here's a PowerShell installer that handles downloading, extracting, and generating a `run.ps1`:

[Download install.ps1](/articles/1bit-llm/install.ps1)

```bash
# Default — 8B model, CUDA 13.1, port 8080
powershell -ExecutionPolicy Bypass -File install.ps1

# Options
powershell -ExecutionPolicy Bypass -File install.ps1 -ModelSize 4B
powershell -ExecutionPolicy Bypass -File install.ps1 -CudaVersion 12.4
powershell -ExecutionPolicy Bypass -File install.ps1 -InstallDir D:\ai\bonsai -Port 8081
```

After install, use the generated `run.ps1` to start the server with the correct flags automatically.

---

## Performance (RTX 5080 Laptop, 16 GB VRAM)

| Metric | Result |
|---|---|
| VRAM used | ~1.1 GB |
| Generation speed | ~181 tokens/sec |
| Prompt eval (512 tokens) | ~4,882 tokens/sec |
| Prompt eval (16K tokens) | ~1,591 tokens/sec |
| Context window | 65,536 tokens |

Speed drops as the context fills — this is expected, as the KV cache grows and attention computation scales with sequence length. Even at 32K tokens in context it stays very usable.

---

## Connecting it to other tools

The server exposes an OpenAI-compatible API at `http://localhost:8080/v1`, which means it drops straight into:

- **[AnythingLLM](https://anythingllm.com/)** — add a custom OpenAI endpoint and you get RAG, web search, PDF generation, tool calling, and agents all working against the local model
- **[Open WebUI](https://github.com/open-webui/open-webui)** — clean chat interface with conversation history
- **[Continue](https://continue.dev/)** — VS Code / JetBrains extension for inline AI assistance
- Any OpenAI SDK — just set `base_url` to `http://localhost:8080/v1` and `api_key` to anything

The tool-calling capability is notably stronger than other 1-bit models currently available. Multi-step agentic tasks (web search → summarise → create document) work reliably.

---

## Troubleshooting

**`invalid ggml type` on load**
You're using standard llama.cpp. Download the PrismML fork from the releases page linked above.

**Slow generation / CPU fallback**
Run `nvidia-smi` to check GPU memory usage. If the model isn't appearing there, try removing `-ngl 99` and re-adding it, or verify the CUDA DLLs are in the same folder as `llama-server.exe`.

**Out of VRAM**
The 8B model only needs ~1.1 GB. If you're hitting limits, another application is likely holding VRAM. Close browsers, games, or other AI tools and retry.

**Port already in use**
Change `--port 8080` to `--port 8081` (or any free port) and update any connected tools accordingly.

---

## What's next

The model sizes currently top out at 8B. But PrismML's Discord has community members already experimenting with applying the 1-bit transformation to open-weight models like Qwen3 27B. If that proves out, running a 27B-class model on a mid-range laptop with 8 GB RAM becomes realistic.

Pair that with proper KV cache compression (TurboQuant is tracking toward upstream llama.cpp) and local AI inference takes a meaningful step toward matching the experience of calling a cloud API — without the latency, cost, or privacy tradeoffs.

Worth watching.

---

## Links

- [YouTube: How to run Bonsai 8B on Windows (the video that started this)](https://www.youtube.com/watch?v=0fWFetwHkVE)
- [BitNet paper (arXiv, 2023)](https://arxiv.org/abs/2310.11453)
- [Microsoft BitNet repo](https://github.com/microsoft/BitNet)
- [PrismML Bonsai announcement](https://prism-ml.com/bonsai)
- [PrismML llama.cpp fork](https://github.com/PrismML-Eng/llama.cpp)
- [Bonsai-8B on Hugging Face](https://huggingface.co/prism-ml/Bonsai-8B-gguf)
- [Bonsai-4B on Hugging Face](https://huggingface.co/prism-ml/Bonsai-4B-gguf)
- [Bonsai-1.7B on Hugging Face](https://huggingface.co/prism-ml/Bonsai-1.7B-gguf)
- [TurboQuant paper (arXiv)](https://arxiv.org/abs/2404.03382)
- [AnythingLLM](https://anythingllm.com/)
