import { test, expect } from '@playwright/test';

test.describe('Article PDF action', () => {
  test('article pages expose a PDF button that is hidden in print output', async ({ page }) => {
    await page.goto('/articles/resume/');

    const pdfButton = page.getByRole('button', { name: 'Create PDF from this article' });
    await expect(pdfButton).toBeVisible();
    await expect(pdfButton).toHaveAttribute('onclick', 'window.print()');

    await page.emulateMedia({ media: 'print' });
    await expect(pdfButton).toBeHidden();
    await expect(page.locator('footer')).toBeHidden();
    await expect(page.locator('.tags')).toBeHidden();
  });

  test('the brief resume renders as a one-page PDF and links to the full resume', async ({ page }) => {
    await page.goto('/articles/resume-brief/');

    await expect(page.getByRole('link', { name: 'blog.danmarshall.dev/articles/resume' })).toHaveAttribute(
      'href',
      'https://blog.danmarshall.dev/articles/resume/'
    );

    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    const pageCount = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
    expect(pageCount).toBe(1);
  });

  test('the printed brief resume omits the article title and includes the resume heading', async ({ page }) => {
    await page.goto('/articles/resume-brief/');
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.header')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Dan Marshall' })).toBeVisible();
  });

  test('printed code blocks wrap without scrollbars', async ({ page }) => {
    await page.goto('/articles/1bit-llm/');
    await page.emulateMedia({ media: 'print' });

    const styles = await page.locator('pre').first().evaluate((pre) => {
      const code = pre.querySelector('code');
      const preStyle = getComputedStyle(pre);
      const scrollbarStyle = getComputedStyle(pre, '::-webkit-scrollbar');
      const codeStyle = code ? getComputedStyle(code) : null;

      return {
        preOverflowX: preStyle.overflowX,
        preWhiteSpace: preStyle.whiteSpace,
        preScrollbarWidth: preStyle.scrollbarWidth,
        webkitScrollbarDisplay: scrollbarStyle.display,
        webkitScrollbarHeight: scrollbarStyle.height,
        codeWhiteSpace: codeStyle?.whiteSpace,
      };
    });

    expect(styles.preOverflowX).toBe('visible');
    expect(styles.preWhiteSpace).toBe('pre-wrap');
    expect(styles.preScrollbarWidth).toBe('none');
    expect(styles.webkitScrollbarDisplay).toBe('none');
    expect(styles.webkitScrollbarHeight).toBe('0px');
    expect(styles.codeWhiteSpace).toBe('pre-wrap');
  });
});
