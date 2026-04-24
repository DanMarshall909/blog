import json, subprocess, random

model = "flux1-dev-fp8.safetensors"
negative = "blurry, soft focus, out of focus, watermark, photo, realistic, dark, scary, ugly, 3d render, noise, grain, text, letters, words, typography, signage, creepy, horror, gore"

slug = "making-ai-think-like-you"

# Core concept: the author physically transferring his thoughts out of his own head into a robot's head.
# Three different interpretations of the same beat.

p1 = (
    "Flat vector cartoon illustration on a pure white background. A cheerful bearded cartoon man with short brown hair stands on the left. The top of his head is open like a hinged lid, and he is using both hands to lift a glowing pastel thought — shaped like a swirl with a tiny lightbulb — out of his own head. On the right stands a friendly cute white-and-blue robot with its head hatch open and a pastel glow inside, ready to receive the thought. A soft sparkle arc connects them. Pastel palette, clean sharp black outlines, crisp flat colours, high detail, whimsical, no text, white background.",
    f"{slug}_v1",
)

p2 = (
    "Flat vector cartoon illustration on a pure white background. Side view: a smiling cartoon developer tilts his own head open at the top like a jar lid and pours out a stream of tiny glowing pastel shapes — cogs, lightbulbs, sticky-notes, checklists — that flow through the air in a gentle curve and drop neatly into the open top of a friendly cute robot's head standing next to him. Pastel mint, peach, lavender, soft yellow palette. Clean sharp black outlines, crisp flat colours, whimsical, minimalist, no text, white background.",
    f"{slug}_v2",
)

p3 = (
    "Flat vector cartoon illustration on a pure white background. A cartoon man gently plucks a single glowing thought-bubble out of his own head with his fingertips — the thought is a cute little cartoon icon, like a tiny filing folder or index card with a smile. He is about to place it into the open top of a friendly cute robot's head beside him, which has a pastel glow inside and small cartoon eyes looking up expectantly. Both characters are smiling. Pastel palette, clean sharp black outlines, crisp flat colours, high detail, whimsical, no text, white background.",
    f"{slug}_v3",
)

prompts = [p1, p2, p3]

for prompt_text, prefix in prompts:
    seed = random.randint(1, 999999999)
    workflow = {
      "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": model}},
      "2": {"class_type": "CLIPTextEncodeFlux", "inputs": {"clip": ["1", 1], "clip_l": prompt_text, "t5xxl": prompt_text, "guidance": 5.0}},
      "3": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["1", 1]}},
      "4": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
      "5": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0], "seed": seed, "steps": 35, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
      "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
      "7": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["6", 0]}}
    }
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", "http://localhost:8188/prompt",
         "-H", "Content-Type: application/json",
         "-d", json.dumps({"prompt": workflow})],
        capture_output=True, text=True
    )
    pid = json.loads(result.stdout)["prompt_id"]
    print(f"{prefix}: {pid} seed={seed}")
