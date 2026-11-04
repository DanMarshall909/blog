import { expect, test } from "@playwright/test";

test("the site renders with the Ink theme", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const background = await page.locator("body").evaluate((body) =>
    getComputedStyle(body).backgroundColor,
  );
  if (background.startsWith("oklch(")) {
    expect(Number(background.match(/[\d.]+/)?.[0])).toBeLessThan(0.3);
  } else {
    const channels = background.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    expect(channels).toHaveLength(3);

    const scale = background.startsWith("color(srgb") ? 1 : 255;
    expect(channels!.reduce((sum, channel) => sum + channel, 0)).toBeLessThan(
      scale * 0.75,
    );
  }
});

test("code blocks use a borderless tinted panel in the Ink theme", async ({
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
  expect(styles.background).not.toBe("rgba(0, 0, 0, 0)");
  const panelChannels = styles.background.match(/[\d.]+/g)?.map(Number);
  expect(panelChannels).toHaveLength(4);
  expect(panelChannels!.slice(0, 3)).toEqual([255, 255, 255]);
  expect(panelChannels![3]).toBeCloseTo(0.15, 2);
  expect(styles.foreground).not.toBe(styles.bodyBackground);
  expect(styles.tokenForeground).not.toBe(styles.bodyBackground);
});

test("code wrapping defaults on and persists as a page-wide cookie preference", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto("/articles/secure-csharp-by-design/");

  const codeBlocks = page.locator("article.article pre");
  const wrapToggles = page.locator("article.article .code-wrap-toggle");
  const blockCount = await codeBlocks.count();

  expect(blockCount).toBeGreaterThan(0);
  await expect(wrapToggles).toHaveCount(blockCount);
  await expect(codeBlocks.first()).toHaveClass(/wrap-enabled/);
  await expect(wrapToggles.first()).toHaveAttribute(
    "aria-label",
    "Disable code wrapping",
  );

  await wrapToggles.first().click();
  await expect(page.locator("article.article pre.wrap-enabled")).toHaveCount(0);
  await expect(wrapToggles.first()).toHaveAttribute(
    "aria-label",
    "Enable code wrapping",
  );

  const disabledPreference = (await context.cookies()).find(
    (cookie) => cookie.name === "code-wrap",
  );
  expect(disabledPreference?.value).toBe("off");

  await page.reload();
  await expect(page.locator("article.article pre.wrap-enabled")).toHaveCount(0);
  await expect(
    page.locator("article.article .code-wrap-toggle").first(),
  ).toHaveAttribute("aria-label", "Enable code wrapping");

  await page.locator("article.article .code-wrap-toggle").first().click();
  await expect(page.locator("article.article pre.wrap-enabled")).toHaveCount(
    blockCount,
  );
  await expect(
    page.locator("article.article .code-wrap-toggle").first(),
  ).toHaveAttribute("aria-label", "Disable code wrapping");

  const enabledPreference = (await context.cookies()).find(
    (cookie) => cookie.name === "code-wrap",
  );
  expect(enabledPreference?.value).toBe("on");

  await page.reload();
  await expect(page.locator("article.article pre.wrap-enabled")).toHaveCount(
    blockCount,
  );
  await expect(
    page.locator("article.article .code-wrap-toggle").first(),
  ).toHaveAttribute("aria-label", "Disable code wrapping");
});

test("code blocks display fully through 50 lines and disclose longer blocks", async ({
  page,
}) => {
  const lines = (count: number) =>
    Array.from({ length: count }, (_, index) => `line ${index + 1}`).join("\n");

  await page.route("**/articles/secure-csharp-by-design/", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const fixtures = [
      `<pre id="fifty-line-code"><code>${lines(50)}</code></pre>`,
      `<pre id="fifty-one-line-code"><code>${lines(51)}</code></pre>`,
    ].join("");

    expect(body).toContain("</section>");
    await route.fulfill({
      response,
      body: body.replace("</section>", `${fixtures}</section>`),
    });
  });

  await page.goto("/articles/secure-csharp-by-design/");

  const fiftyLines = page.locator("#fifty-line-code");
  await expect(fiftyLines).toBeVisible();
  await expect(fiftyLines).not.toHaveClass(/code-truncated/);
  await expect(
    fiftyLines.locator(
      "xpath=ancestor::details[contains(@class, 'code-disclosure')]",
    ),
  ).toHaveCount(0);

  const longDisclosure = page.locator(
    '.code-disclosure[data-code-lines="51"]',
  );
  await expect(longDisclosure).toHaveCount(1);
  await expect(longDisclosure.locator("summary")).toHaveText(
    "Show code (51 lines)",
  );
  await expect(longDisclosure.locator("#fifty-one-line-code")).toBeAttached();
});

test("show-code disclosures use wrapping without a second preview control", async ({
  page,
}) => {
  await page.goto("/articles/ai-assisted-job-search/");

  const disclosure = page.locator(".code-disclosure").first();
  await expect(disclosure).toBeVisible();
  await expect(disclosure.locator(".code-expand-toggle")).toHaveCount(0);
  await expect(disclosure.locator(".code-wrap-toggle")).toHaveCount(1);
  await expect(disclosure.locator("pre")).toHaveClass(/wrap-enabled/);
});

test("Mermaid diagrams preserve horizontal scrolling without visible scrollbars", async ({
  page,
}) => {
  await page.goto("/articles/oidc-wont-stop-the-next-litellm/");

  const diagram = page.locator(".mermaid-diagram").first();
  await expect(diagram).toBeVisible();

  const styles = await diagram.evaluate((element) => ({
    overflowX: getComputedStyle(element).overflowX,
    scrollbarWidth: getComputedStyle(element).scrollbarWidth,
    webkitScrollbarDisplay: getComputedStyle(element, "::-webkit-scrollbar").display,
  }));

  expect(styles.overflowX).toBe("auto");
  expect(styles.scrollbarWidth).toBe("none");
  expect(styles.webkitScrollbarDisplay).toBe("none");
});

test("Mermaid diagrams have readable labels and connectors on screen and in print", async ({ page }) => {
  await page.goto("/articles/oidc-wont-stop-the-next-litellm/");
  const diagram = page.locator(".mermaid-diagram svg").first();
  await expect(diagram).toBeVisible();
  const label = diagram.locator(".nodeLabel").first();
  const edge = diagram.locator(".flowchart-link").first();
  await expect(label).toHaveCSS("color", "rgb(232, 230, 227)");
  await expect(edge).toHaveCSS("stroke", "rgb(184, 178, 172)");

  await page.emulateMedia({ media: "print" });
  await expect(label).toHaveCSS("color", "rgb(31, 41, 55)");
  await expect(edge).toHaveCSS("stroke", "rgb(75, 85, 99)");
});
