import { expect, test } from "@playwright/test";

test("a subtle plasma drifts behind frosted panels without blocking links", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");

  const plasma = page.locator("#plasma-canvas");
  await expect(plasma).toBeVisible();
  const pattern = await plasma.evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let colored = 0;
    let marks = 0;
    let gaps = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] === 0) gaps++;
      else {
        marks++;
        if (pixels[index] !== pixels[index + 1] || pixels[index + 1] !== pixels[index + 2]) colored++;
      }
    }
    return { colored, marks, gaps };
  });
  expect(pattern.colored).toBe(0);
  expect(pattern.marks).toBeGreaterThan(0);
  expect(pattern.gaps).toBeGreaterThan(0);
  const first = await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.clock.fastForward(10_000);
  expect(await plasma.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()) !== first).toBe(true);

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
