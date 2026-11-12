(function () {
  const canvas = document.getElementById("plasma-canvas");
  const context = canvas?.getContext("2d");
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const printing = window.matchMedia("print");
  let elapsed = 0;
  let lastTime = 0;
  let lastPaint = -Infinity;
  let frame = 0;

  function paint() {
    const { width, height } = canvas;
    const aspect = width / height;
    const time = elapsed * 0.000055;
    const step = 12;
    const layers = Array.from({ length: 4 }, () => new Path2D());
    context.clearRect(0, 0, width, height);

    for (let y = 0; y < height; y += step) {
      const py = (y / height - 0.5) * 4;
      for (let x = 0; x < width; x += step) {
        const px = (x / width - 0.5) * 4 * aspect;
        // The classic plasma: interfering sine waves and a moving radial wave.
        const wave = Math.sin(px * 2.1 + time)
          + Math.sin(py * 2.4 - time * 0.7)
          + Math.sin((px + py) * 1.5 + time * 0.6)
          + Math.sin(Math.hypot(px + Math.sin(time * 0.4), py) * 2.8 - time);
        const phase = wave * 0.85 + time * 0.3;
        const intensity = (Math.cos(phase) + 1) * 0.5;
        if (intensity < 0.18) continue;

        const path = layers[Math.min(3, Math.floor(intensity * layers.length))];
        path.moveTo(x, y + step);
        path.lineTo(x + step, y);

        // Stronger plasma adds crossing lines, then a second diagonal pass.
        if (intensity > 0.55) {
          path.moveTo(x, y);
          path.lineTo(x + step, y + step);
        }
        if (intensity > 0.82) {
          path.moveTo(x, y + step / 2);
          path.lineTo(x + step / 2, y);
          path.moveTo(x + step / 2, y + step);
          path.lineTo(x + step, y + step / 2);
        }
      }
    }

    context.lineWidth = 0.7;
    layers.forEach((path, index) => {
      context.strokeStyle = `rgba(210, 210, 210, ${0.18 + index * 0.22})`;
      context.stroke(path);
    });
  }

  function resize() {
    // Keep the hatching crisp at ordinary sizes and cap large-screen work.
    const scale = Math.min(1, 1600 / Math.max(window.innerWidth, window.innerHeight));
    canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
    canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
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
