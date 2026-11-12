(function () {
  const canvas = document.getElementById("plasma-canvas");
  const context = canvas?.getContext("2d");
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const printing = window.matchMedia("print");
  let pixels;
  let elapsed = 0;
  let lastTime = 0;
  let lastPaint = -Infinity;
  let frame = 0;

  function paint() {
    const { width, height } = canvas;
    const aspect = width / height;
    const time = elapsed * 0.000055;
    for (let y = 0; y < height; y++) {
      const py = (y / height - 0.5) * 4;
      for (let x = 0; x < width; x++) {
        const px = (x / width - 0.5) * 4 * aspect;
        // The classic plasma: interfering sine waves and a moving radial wave.
        const wave = Math.sin(px * 2.1 + time)
          + Math.sin(py * 2.4 - time * 0.7)
          + Math.sin((px + py) * 1.5 + time * 0.6)
          + Math.sin(Math.hypot(px + Math.sin(time * 0.4), py) * 2.8 - time);
        const phase = wave * 0.85 + time * 0.3;
        const offset = (y * width + x) * 4;
        pixels.data[offset] = 46 + 24 * Math.cos(phase + 0.4);
        pixels.data[offset + 1] = 50 + 24 * Math.cos(phase + 2.3);
        pixels.data[offset + 2] = 65 + 28 * Math.cos(phase + 4.2);
        pixels.data[offset + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
  }

  function resize() {
    // Render a small, softly interpolated field, independent of screen DPR.
    const scale = 224 / Math.max(window.innerWidth, window.innerHeight);
    canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
    canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
    pixels = context.createImageData(canvas.width, canvas.height);
    paint();
  }

  function animate(timestamp) {
    // A queued frame can arrive before the browser's media-change event.
    if (reducedMotion.matches || printing.matches || document.hidden) {
      frame = 0;
      return;
    }
    elapsed += timestamp - lastTime;
    lastTime = timestamp;
    if (timestamp - lastPaint >= 50) {
      paint();
      lastPaint = timestamp;
    }
    frame = requestAnimationFrame(animate);
  }

  function syncMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = performance.now();
    if (!reducedMotion.matches && !printing.matches && !document.hidden) {
      frame = requestAnimationFrame(animate);
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", syncMotion);
  reducedMotion.addEventListener("change", syncMotion);
  printing.addEventListener("change", syncMotion);
  resize();
  syncMotion();
})();
