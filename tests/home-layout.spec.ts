import { expect, test } from "@playwright/test";

test("the resume and featured article cards share a top edge", async ({ page }) => {
  await page.goto("/");

  const cards = page.locator(".featured-card-row > .featured-card-column > .featured-card");
  await expect(cards).toHaveCount(2);

  const [featuredBox, resumeBox] = await Promise.all([
    cards.nth(0).boundingBox(),
    cards.nth(1).boundingBox(),
  ]);

  expect(featuredBox).not.toBeNull();
  expect(resumeBox).not.toBeNull();
  expect(featuredBox!.y).toBeCloseTo(resumeBox!.y, 0);
});

test("header tooltips can extend above the content panel", async ({ page }) => {
  await page.goto("/");

  const stacking = await page.locator(".header").evaluate((header) => ({
    overflowY: getComputedStyle(header).overflowY,
    zIndex: Number(getComputedStyle(header).zIndex),
    contentZIndex: Number(getComputedStyle(document.querySelector("#content")!).zIndex),
  }));

  expect(stacking.overflowY).toBe("visible");
  expect(stacking.zIndex).toBeGreaterThan(stacking.contentZIndex);
});
