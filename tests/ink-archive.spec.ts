import { expect, test } from "@playwright/test";

test("the archive uses the Ink rail and flattened article rows", async ({ page }) => {
  await page.goto("/archive/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".ink-archive-rail")).toBeVisible();
  await expect(page.locator(".ink-archive-row").first()).toBeVisible();

  const row = page.locator(".ink-archive-row").first();
  await expect(row.locator(".ink-archive-title")).toHaveAttribute("href", /\/articles\//);
  await expect(row.locator("time")).toHaveText(/\d{2} [A-Z]{3} \d{4}/);

  const styles = await page.locator("body").evaluate((body) => {
    const bodyStyle = getComputedStyle(body);
    const rowStyle = getComputedStyle(document.querySelector(".ink-archive-row")!);
    return { background: bodyStyle.backgroundColor, rowBorder: rowStyle.borderTopWidth };
  });

  expect(styles.background).toMatch(/^oklch\(0\.[01]|^rgb\((?:[0-5]\d|6\d),/);
  expect(styles.rowBorder).toBe("1px");
});

test("archive and footer stay aligned without horizontal overflow", async ({ page }) => {
  for (const width of [390, 800, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/archive/");

    const layout = await page.evaluate(() => {
      const header = document.querySelector(".header .content-wrap")!.getBoundingClientRect();
      const archive = document.querySelector(".ink-archive")!.getBoundingClientRect();
      const footer = document.querySelector(".site-footer .content-wrap")!.getBoundingClientRect();
      return {
        viewport: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        headerLeft: header.left,
        archiveLeft: archive.left,
        footerRight: footer.right,
      };
    });

    expect(layout.documentWidth, `at ${width}px`).toBeLessThanOrEqual(layout.viewport);
    expect(layout.archiveLeft, `at ${width}px`).toBeCloseTo(layout.headerLeft, 0);
    expect(layout.footerRight, `at ${width}px`).toBeLessThanOrEqual(layout.viewport);
  }
});
