import { expect, test } from "@playwright/test";

test("a subtle plasma drifts behind frosted panels without blocking links", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");

  const plasma = page.locator("#plasma-canvas");
  await expect(plasma).toBeVisible();
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
