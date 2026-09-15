import { expect, test } from "@playwright/test";

test("the site renders with the light theme", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  const background = await page.locator("body").evaluate((body) =>
    getComputedStyle(body).backgroundColor,
  );
  if (background.startsWith("oklch(")) {
    expect(Number(background.match(/[\d.]+/)?.[0])).toBeGreaterThan(0.8);
  } else {
    const channels = background.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    expect(channels).toHaveLength(3);

    const scale = background.startsWith("color(srgb") ? 1 : 255;
    expect(channels!.reduce((sum, channel) => sum + channel, 0)).toBeGreaterThan(
      scale * 2.35,
    );
  }
});

test("code blocks use a borderless tinted panel in the light theme", async ({
  page,
}) => {
  await page.goto("/articles/dont-just-plug-holes-in-mutation-tests/");

  const panel = page.locator("pre").first();
  await expect(panel).toBeVisible();

  const styles = await panel.evaluate((pre) => {
    const panelStyle = getComputedStyle(pre);
    const bodyStyle = getComputedStyle(document.body);

    return {
      background: panelStyle.backgroundColor,
      bodyBackground: bodyStyle.backgroundColor,
      borderWidth: panelStyle.borderTopWidth,
      foreground: panelStyle.color,
      tokenForeground: getComputedStyle(pre.querySelector("span") ?? pre).color,
    };
  });

  expect(styles.borderWidth).toBe("0px");
  expect(styles.background).not.toBe(styles.bodyBackground);
  expect(styles.background).toMatch(/^oklch\(0\.(8|9)|^rgb\(2[1-5]\d/);
  expect(styles.foreground).toMatch(/^oklch\(0\.[1-4]|^rgb\((?:\d{1,2}|1\d\d)/);
  expect(styles.tokenForeground).toMatch(
    /^oklch\(0\.[1-5]|^rgb\((?:\d{1,2}|1\d\d)/,
  );
});
