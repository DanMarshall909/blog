import { createHalftoneScreens, renderCmykHalftones, separateCmyk } from "./cmyk-halftone.mjs";

(function () {
  const canvas = document.getElementById("plasma-canvas");
  const context = canvas?.getContext("2d");
  const rgbCanvas = document.getElementById("plasma-rgb-canvas");
  const rgbContext = rgbCanvas?.getContext("2d");
  if (!context || !rgbContext) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const printing = window.matchMedia("print");
  const palette = [
    [38, 118, 245], [170, 65, 245], [255, 140, 30], [245, 45, 60], [38, 118, 245],
  ];
  let rgbImage, pixels, plates, screens;
  let elapsed = 0;
  let lastTime = 0;
  let lastPaint = -Infinity;
  let frame = 0;
  let resizeFrame = 0;

  function renderRgbPlasma() {
    const { width, height } = rgbImage;
    const time = elapsed * 0.000165;
    const orbit = Math.sin(time * 0.4);
    const palettePhase = (elapsed % 160_000) / 40_000;
    for (let y = 0; y < height; y++) {
      const py = ((y + 0.5) / height - 0.5) * 4;
      for (let x = 0; x < width; x++) {
        const px = ((x + 0.5) / width - 0.5) * 4 * width / height;
        const wave = Math.sin(px * 2.1 + time)
          + Math.sin(py * 2.4 - time * 0.7)
          + Math.sin((px + py) * 1.5 + time * 0.6)
          + Math.sin(Math.hypot(px + orbit, py) * 2.8 - time);
        const brightness = (Math.cos(wave * 0.85 + time * 0.3) + 1) / 2;
        const tone = Math.pow(Math.max(0, Math.min(1, (brightness - 0.01) / 0.9899)), 0.7);
        const localHue = palettePhase + px * 0.45 + py * 0.3
          + Math.sin(px * 0.65 + py * 0.8 + time * 0.12) * 0.6;
        const hue = ((localHue % 4) + 4) % 4;
        const segment = Math.floor(hue);
        const blend = (1 - Math.cos((hue - segment) * Math.PI)) / 2;
        const gain = Math.min(1, tone / 0.95), white = Math.max(0, (tone - 0.95) / 0.05);
        const offset = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const colour = palette[segment][channel]
            + (palette[segment + 1][channel] - palette[segment][channel]) * blend;
          rgbImage.data[offset + channel] = colour * gain + (255 - colour) * white;
        }
        rgbImage.data[offset + 3] = 255;
      }
    }
    rgbContext.putImageData(rgbImage, 0, 0);
  }

  function paint() {
    renderRgbPlasma();
    plates = separateCmyk(rgbImage, plates);
    renderCmykHalftones(plates, rgbImage.width, rgbImage.height, screens, pixels);
    context.putImageData(pixels, 0, 0);
  }

  function resize() {
    const scale = Math.min(1, 1024 / Math.max(window.innerWidth, window.innerHeight));
    const width = canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
    const height = canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
    rgbCanvas.width = Math.max(1, Math.ceil(width / 4));
    rgbCanvas.height = Math.max(1, Math.ceil(height / 4));
    rgbImage = rgbContext.createImageData(rgbCanvas.width, rgbCanvas.height);
    pixels = context.createImageData(width, height);
    plates = undefined;
    screens = createHalftoneScreens(width, height, Math.max(6, 10 * scale));
    paint();
  }

  function animate(timestamp) {
    if (reducedMotion.matches || printing.matches || document.hidden) {
      frame = 0;
      return;
    }
    // Frame time can precede the setup clock after the initial render.
    const now = Math.max(timestamp, lastTime);
    elapsed += now - lastTime;
    lastTime = now;
    if (timestamp - lastPaint >= 100) {
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

  window.addEventListener("resize", () => {
    if (!resizeFrame) resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resize();
    });
  }, { passive: true });
  document.addEventListener("visibilitychange", syncMotion);
  reducedMotion.addEventListener("change", syncMotion);
  printing.addEventListener("change", syncMotion);
  resize();
  syncMotion();
})();
