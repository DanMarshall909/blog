import os, time, sys
from rembg import remove
from PIL import Image
import io

output_dir = r"C:\flux\ComfyUI_windows_portable\ComfyUI\output"
slug = "making-ai-think-like-you"
expected = [f"{slug}_v1_00001_.png", f"{slug}_v2_00001_.png", f"{slug}_v3_00001_.png"]
dest_dir = rf"C:\code\blog\public\articles\{slug}\variations"
os.makedirs(dest_dir, exist_ok=True)

def save_transparent(src, dst):
    with open(src, "rb") as f:
        out = remove(f.read())
    img = Image.open(io.BytesIO(out)).convert("RGBA")
    img.save(dst)

found = set()
for i in range(200):
    time.sleep(3)
    for fname in expected:
        if fname in found:
            continue
        fpath = os.path.join(output_dir, fname)
        if os.path.exists(fpath):
            time.sleep(1)
            dest = os.path.join(dest_dir, fname)
            save_transparent(fpath, dest)
            found.add(fname)
            print(f"DONE: {fname}", flush=True)
    if len(found) == 3:
        print("ALL DONE", flush=True)
        sys.exit(0)
    if i % 5 == 0:
        print(f"...{(i+1)*3}s ({len(found)}/3)", flush=True)
print("TIMEOUT"); sys.exit(1)
