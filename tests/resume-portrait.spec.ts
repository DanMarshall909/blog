import { expect, test } from '@playwright/test';

for (const slug of ['resume', 'resume-brief']) {
  test(`${slug} keeps the portrait square and centred on phones`, async ({ page }) => {
    for (const width of [319, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/articles/${slug}/`);

      const portrait = page.locator('.hero-image-picture');
      const image = portrait.locator('img');
      await expect(image).toBeVisible();

      const geometry = await image.evaluate(async (img: HTMLImageElement) => {
        await img.decode();
        const imageBox = img.getBoundingClientRect();
        const frameBox = img.parentElement!.getBoundingClientRect();
        return {
          imageWidth: imageBox.width,
          imageHeight: imageBox.height,
          frameWidth: frameBox.width,
          frameHeight: frameBox.height,
          horizontalOffset: (imageBox.left + imageBox.right - frameBox.left - frameBox.right) / 2,
          verticalOffset: (imageBox.top + imageBox.bottom - frameBox.top - frameBox.bottom) / 2,
          pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });

      expect(Math.abs(geometry.imageWidth - geometry.imageHeight), `${width}px image is square`).toBeLessThan(1);
      expect(Math.abs(geometry.frameWidth - geometry.frameHeight), `${width}px frame is square`).toBeLessThan(1);
      expect(Math.abs(geometry.horizontalOffset), `${width}px horizontal alignment`).toBeLessThan(1);
      expect(Math.abs(geometry.verticalOffset), `${width}px vertical alignment`).toBeLessThan(1);
      expect(geometry.pageOverflow, `${width}px page fits viewport`).toBeLessThanOrEqual(1);
    }
  });
}
