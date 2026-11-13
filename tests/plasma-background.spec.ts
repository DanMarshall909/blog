import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { createHalftoneScreens, renderCmykHalftones, separateCmyk } from "../src/scripts/cmyk-halftone.mjs";

test("a frame timestamp before setup finishes still starts the animation", () => {
  const frames: Array<(timestamp: number) => void> = [];
  const context = {
    createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData() {},
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  vm.runInNewContext(readFileSync(resolve(__dirname, "../src/scripts/plasma-background.js"), "utf8").replace(/^import[^\n]+\n/, ""), {
    createHalftoneScreens, renderCmykHalftones, separateCmyk,
    document: { hidden: false, getElementById: () => canvas, addEventListener() {} },
    window: {
      innerWidth: 1, innerHeight: 1,
      matchMedia: () => ({ matches: false, addEventListener() {} }),
      addEventListener() {},
    },
    performance: { now: () => 100 },
    requestAnimationFrame: (callback: (timestamp: number) => void) => frames.push(callback),
    cancelAnimationFrame() {},
  });

  const firstFrame = frames.shift()!;
  expect(firstFrame).toBeDefined();
  expect(() => firstFrame(80)).not.toThrow();
  expect(frames).toHaveLength(1);
});

test("CMYK halftones drift through the requested colours behind frosted panels", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");

  const plasma = page.locator("#plasma-canvas");
  await expect(plasma).toBeVisible();
  const readTone = () => plasma.evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    const sourceCanvas = document.getElementById("plasma-rgb-canvas") as HTMLCanvasElement | null;
    const source = sourceCanvas?.getContext("2d")?.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
    const regions = Array.from({ length: 24 }, () => ({ red: 0, blue: 0 }));
    let cyan = 0, magenta = 0, yellow = 0, key = 0, paper = 0, gaps = 0;
    let nonProcessInk = 0, blueOverlap = 0, redOverlap = 0;
    let rgbIntermediate = 0, rgbWhite = 0, rgbBlack = 0;
    const isProcessChannel = (channel: number) => channel === 0 || channel === 255;
    for (let index = 0; index < pixels.length; index += 4) {
      const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
      const alpha = pixels[index + 3] / 255;
      const pixel = index / 4;
      const x = pixel % canvas.width, y = Math.floor(pixel / canvas.width);
      const region = regions[Math.floor(y * 4 / canvas.height) * 6 + Math.floor(x * 6 / canvas.width)];
      region.red += r * alpha;
      region.blue += b * alpha;
      if (r < 64 && g > 200 && b > 200) cyan++;
      if (r > 200 && g < 64 && b > 200) magenta++;
      if (r > 200 && g > 200 && b < 64) yellow++;
      if (r < 20 && g < 20 && b < 20 && pixels[index + 3] > 200) key++;
      if (r > 235 && g > 230 && b > 215 && pixels[index + 3] > 200) paper++;
      if (pixels[index + 3] === 0) gaps++;
      else if (pixels[index + 3] !== 255 || !isProcessChannel(r) || !isProcessChannel(g) || !isProcessChannel(b)) nonProcessInk++;
      if (r === 0 && g === 0 && b === 255) blueOverlap++;
      if (r === 255 && g === 0 && b === 0) redOverlap++;
    }
    if (source) for (let index = 0; index < source.length; index += 4) {
      const r = source[index], g = source[index + 1], b = source[index + 2];
      if (r === 255 && g === 255 && b === 255) rgbWhite++;
      if (r === 0 && g === 0 && b === 0) rgbBlack++;
      if (!isProcessChannel(r) || !isProcessChannel(g) || !isProcessChannel(b)) rgbIntermediate++;
    }
    return {
      cyan, magenta, yellow, key, paper, gaps, nonProcessInk, blueOverlap, redOverlap, rgbIntermediate, rgbWhite, rgbBlack,
      warmRegions: regions.filter(region => region.red > region.blue * 1.2).length,
      coolRegions: regions.filter(region => region.blue > region.red * 1.2).length,
    };
  });
  const initial = await readTone();
  expect(initial.rgbIntermediate).toBeGreaterThan(0);
  expect(initial.rgbWhite).toBeGreaterThan(0);
  expect(initial.rgbBlack).toBeGreaterThan(0);
  await expect(plasma).toHaveCSS("opacity", "1");
  await expect(page.locator("#plasma-rgb-canvas")).toBeHidden();
  for (const ink of [initial.cyan, initial.magenta, initial.yellow, initial.key]) expect(ink).toBeGreaterThan(0);
  expect(initial.nonProcessInk).toBe(0);
  expect(initial.blueOverlap).toBeGreaterThan(0);
  expect(initial.redOverlap).toBeGreaterThan(0);
  expect(initial.gaps).toBe(0);
  expect(initial.paper).toBeGreaterThan(0);
  expect(initial.warmRegions).toBeGreaterThanOrEqual(2);
  expect(initial.coolRegions).toBeGreaterThanOrEqual(2);
  const first = await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.clock.fastForward(10_000);
  expect(await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()) !== first).toBe(true);

  for (const duration of [30_000, 40_000, 40_000, 40_000]) {
    await page.clock.fastForward(duration);
    const tone = await readTone();
    expect(tone.warmRegions).toBeGreaterThanOrEqual(2);
    expect(tone.coolRegions).toBeGreaterThanOrEqual(2);
    expect(tone.yellow).toBeGreaterThan(0);
    expect(tone.gaps).toBe(0);
    expect(tone.paper).toBeGreaterThan(0);
    expect(tone.nonProcessInk).toBe(0);
    expect(tone.rgbIntermediate).toBeGreaterThan(0);
    expect(tone.rgbWhite).toBeGreaterThan(0);
    expect(tone.rgbBlack).toBeGreaterThan(0);
  }

  const surface = await page.locator(".featured-card").first().evaluate((panel) => {
    const style = getComputedStyle(panel);
    return { background: style.backgroundColor, blur: style.backdropFilter };
  });
  expect(surface.background).toMatch(/\/\s*0\.\d+\)|rgba\([^)]*,\s*0\.\d+\)/);
  expect(surface.blur).toContain("blur(");
  await page.locator('.site-nav a[href="/archive/"]').click();
  await expect(page).toHaveURL(/\/archive\/$/);
});

test("reduced motion keeps the plasma still and printing hides it", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/articles/resume-brief/");

  const plasma = page.locator("#plasma-canvas");
  await expect(plasma).toBeVisible();
  const snapshot = () => page.locator(".page-scene canvas").evaluateAll(canvases =>
    canvases.map(canvas => (canvas as HTMLCanvasElement).toDataURL()).join("|"));
  const still = await snapshot();
  await page.clock.fastForward(30_000);
  expect(await snapshot() === still).toBe(true);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(async () => {
    await page.clock.fastForward(1_000);
    return await snapshot() !== still;
  }).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.runFor(100);
  const frozen = await snapshot();
  await page.clock.fastForward(30_000);
  expect(await snapshot() === frozen).toBe(true);

  await page.emulateMedia({ media: "print" });
  await expect(plasma).toBeHidden();
  await expect(page.locator(".page-scene")).toBeHidden();
  await expect(page.locator(".article")).toHaveCSS("backdrop-filter", "none");
});
