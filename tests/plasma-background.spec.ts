import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

test("a frame timestamp before setup finishes still starts the animation", () => {
  const frames: Array<(timestamp: number) => void> = [];
  const context = {
    createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData() {},
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  vm.runInNewContext(readFileSync(resolve(__dirname, "../src/scripts/plasma-background.js"), "utf8"), {
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
    let red = 0, green = 0, blue = 0;
    let cyan = 0, magenta = 0, yellow = 0, key = 0, paper = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2];
      red += r; green += g; blue += b;
      if (r < 64 && g > 200 && b > 200) cyan++;
      if (r > 200 && g < 64 && b > 200) magenta++;
      if (r > 200 && g > 200 && b < 64) yellow++;
      if (r < 20 && g < 20 && b < 20 && pixels[index + 3] > 200) key++;
      if (r > 235 && g > 230 && b > 215 && pixels[index + 3] > 200) paper++;
    }
    return { red, green, blue, cyan, magenta, yellow, key, paper };
  });
  const initial = await readTone();
  for (const ink of [initial.cyan, initial.magenta, initial.key, initial.paper]) expect(ink).toBeGreaterThan(0);
  expect(initial.blue).toBeGreaterThan(initial.red);
  expect(initial.blue).toBeGreaterThan(initial.green);
  const first = await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.clock.fastForward(10_000);
  expect(await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()) !== first).toBe(true);

  await page.clock.fastForward(30_000);
  const purple = await readTone();
  expect(purple.red).toBeGreaterThan(purple.green);
  expect(purple.blue).toBeGreaterThan(purple.green);

  await page.clock.fastForward(40_000);
  const orange = await readTone();
  expect(orange.red).toBeGreaterThan(orange.green);
  expect(orange.green).toBeGreaterThan(orange.blue);
  expect(orange.yellow).toBeGreaterThan(0);

  await page.clock.fastForward(40_000);
  const red = await readTone();
  expect(red.red).toBeGreaterThan(red.green);
  expect(red.red).toBeGreaterThan(red.blue);
  expect(Math.abs(red.green - red.blue)).toBeLessThan((red.red - Math.min(red.green, red.blue)) * 0.25);

  await page.clock.fastForward(40_000);
  const blue = await readTone();
  expect(blue.blue).toBeGreaterThan(blue.red);
  expect(blue.blue).toBeGreaterThan(blue.green);

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
  const still = await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.clock.fastForward(30_000);
  expect(await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()) === still).toBe(true);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(async () => {
    await page.clock.fastForward(1_000);
    return await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()) !== still;
  }).toBe(true);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.runFor(100);
  const frozen = await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.clock.fastForward(30_000);
  expect(await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()) === frozen).toBe(true);

  await page.emulateMedia({ media: "print" });
  await expect(plasma).toBeHidden();
  await expect(page.locator(".article")).toHaveCSS("backdrop-filter", "none");
});
