(function () {
  const canvas = document.getElementById("plasma-canvas");
  const context = canvas?.getContext("2d");
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const printing = window.matchMedia("print");
  const screens = [15, 75, 0, 45].map((angle) => ({
    angle,
    distances: null,
    radii: new Float32Array(256),
  }));
  const palette = [
    [30, 88, 205], [145, 50, 198], [232, 120, 30], [210, 45, 50], [30, 88, 205],
  ];
  let pixels, field, fieldWidth, fieldHeight, pitch;
  let elapsed = 0;
  let lastTime = 0;
  let lastPaint = -Infinity;
  let frame = 0;
  let resizeFrame = 0;

  function inkAmounts() {
    // Forty seconds per fade: blue → purple → orange → red → blue.
    const progress = (elapsed % 160_000) / 40_000;
    const segment = Math.floor(progress);
    const blend = (1 - Math.cos((progress - segment) * Math.PI)) / 2;
    const rgb = palette[segment].map((channel, index) =>
      (channel + (palette[segment + 1][index] - channel) * blend) / 255,
    );
    const maximum = Math.max(...rgb);
    return [...rgb.map((channel) => (maximum - channel) / maximum), 1 - maximum];
  }

  function inkCoverage(screen, level, index) {
    const radius = screen.radii[level];
    if (radius === 0) return 0;
    const edge = (radius - screen.distances[index]) * pitch + 0.5;
    return edge <= 0 ? 0 : edge >= 1 ? 1 : edge;
  }

  function paint() {
    const { width, height } = canvas;
    const time = elapsed * 0.000055;
    const orbit = Math.sin(time * 0.4);
    const amounts = inkAmounts();
    screens.forEach((screen, channel) => {
      for (let level = 0; level < 256; level++) {
        screen.radii[level] = Math.sqrt(amounts[channel] * level / 255 / Math.PI);
      }
    });

    // Sample the smooth plasma coarsely, then interpolate it beneath the dots.
    for (let y = 0; y < fieldHeight; y++) {
      const py = (y * 8 / height - 0.5) * 4;
      for (let x = 0; x < fieldWidth; x++) {
        const px = (x * 8 / width - 0.5) * 4 * width / height;
        const wave = Math.sin(px * 2.1 + time)
          + Math.sin(py * 2.4 - time * 0.7)
          + Math.sin((px + py) * 1.5 + time * 0.6)
          + Math.sin(Math.hypot(px + orbit, py) * 2.8 - time);
        field[y * fieldWidth + x] = (Math.cos(wave * 0.85 + time * 0.3) + 1) / 2;
      }
    }

    for (let y = 0; y < height; y++) {
      const row = Math.floor(y / 8) * fieldWidth;
      const fy = (y % 8) / 8;
      for (let x = 0; x < width; x++) {
        const left = Math.floor(x / 8);
        const fx = (x % 8) / 8;
        const top = field[row + left] * (1 - fx) + field[row + left + 1] * fx;
        const bottom = field[row + fieldWidth + left] * (1 - fx)
          + field[row + fieldWidth + left + 1] * fx;
        const level = Math.min(255, Math.round((top * (1 - fy) + bottom * fy) * 255));
        const index = y * width + x;
        const cyan = inkCoverage(screens[0], level, index);
        const magenta = inkCoverage(screens[1], level, index);
        const yellow = inkCoverage(screens[2], level, index);
        const keyTransmission = 1 - inkCoverage(screens[3], level, index);
        const offset = index * 4;
        // Subtractive ink on warm paper; canvas opacity keeps it subdued.
        pixels.data[offset] = 246 * (1 - cyan) * keyTransmission;
        pixels.data[offset + 1] = 241 * (1 - magenta) * keyTransmission;
        pixels.data[offset + 2] = 230 * (1 - yellow) * keyTransmission;
        pixels.data[offset + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
  }

  function resize() {
    const scale = Math.min(1, 768 / Math.max(window.innerWidth, window.innerHeight));
    const width = canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
    const height = canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
    pitch = Math.max(6, 10 * scale);
    pixels = context.createImageData(width, height);
    fieldWidth = Math.ceil(width / 8) + 1;
    fieldHeight = Math.ceil(height / 8) + 1;
    field = new Float32Array(fieldWidth * fieldHeight);

    // Each ink has its own rotated, fixed-frequency screen. Cache its geometry.
    screens.forEach((screen) => {
      const angle = screen.angle * Math.PI / 180;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      screen.distances = new Float32Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const u = (x * cos + y * sin) / pitch;
          const v = (-x * sin + y * cos) / pitch;
          screen.distances[y * width + x] = Math.hypot(
            u - Math.floor(u) - 0.5, v - Math.floor(v) - 0.5,
          );
        }
      }
    });
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
