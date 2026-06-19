import { test, expect } from '@playwright/test';

test.describe('article card images', () => {
  test('transparent hero images stay visible on the article list', async ({ page }) => {
    await page.goto('/');

    const cardHero = page.locator('.card-hero[href="/articles/my-resume-is-now-a-static-site-feature/"]');
    await expect(cardHero).toBeVisible();

    const styles = await cardHero.evaluate((el) => {
      const image = el.querySelector('img');
      const heroStyle = getComputedStyle(el);
      const imageStyle = image ? getComputedStyle(image) : null;

      return {
        opacity: parseFloat(heroStyle.opacity),
        objectFit: imageStyle?.objectFit,
        objectPosition: imageStyle?.objectPosition,
      };
    });

    expect(styles.opacity).toBeGreaterThanOrEqual(0.4);
    expect(styles.objectFit).toBe('contain');
    expect(styles.objectPosition).toBe('100% 100%');
  });
});
