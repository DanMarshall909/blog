# CSS Refactor Plan

Scope: improve consistency and reduce duplication in `public/styles/main.css` without changing the visual design intentionally.

## Goals

- Centralize repeated texture, surface, pill, and control styles.
- Reduce source-order surprises around tag and pill variants.
- Keep changes behavior-preserving and easy to review in small commits.
- Verify with `npm run build` and visual checks for home, archive, topics, and article detail pages.

## Plan

1. Add shared texture tokens
   - Add variables for the recurring background images:
     - `--texture-light-wood`
     - `--texture-wood`
     - `--texture-ebony`
   - Add common texture-size tokens for `28rem`, `24rem`, and `18rem` patterns.
   - Replace repeated `url("/backgrounds/...")` values where the behavior is identical.

2. Consolidate paper and wood surfaces
   - Expand the existing `--paper-surface` and `.paper-card` pattern where practical.
   - Extract shared values for wood-backed panels used by cards, the article list, the view toggle, and TOC.
   - Keep component-specific shadows as overrides when they meaningfully differ.

3. Normalize pill and tag styling
   - Create a single base pill/tag style for article metadata links, topic links, list tags, and generic tags.
   - Split header-specific tag styling into an explicit variant instead of relying on later `.tag` rules.
   - Preserve existing sizes with small modifier rules.

4. Introduce shared control primitives
   - Add base styles for icon buttons and inline actions.
   - Apply them to `.desktop-back`, `.pdf-button`, `.drawer-close`, `.view-toggle button`, and `.code-toggle` where suitable.
   - Avoid changing markup unless a selector-only cleanup becomes awkward.

5. Clean obvious duplicate declarations
   - Merge split `.desktop-topbar` and `.desktop-back` blocks.
   - Remove redundant `.article-meta` color overrides that repeat `#2f170c`.
   - Reuse the existing `.sr-only` pattern for hidden card-link text if markup allows it.

6. Simplify hero image frame styles
   - Extract shared frame properties for `.hero-image-picture` and `.hero-link`.
   - Keep normal, cropped, and resume portrait variants focused on shape, size, and object-fit differences.

7. Review responsive and print overrides
   - After base consolidation, scan media queries for rules that can be removed because the base styles are cleaner.
   - Be conservative with print and resume-specific styles.

## Suggested Order

1. Tokens and harmless selector merges.
2. Pill/tag normalization.
3. Surface extraction.
4. Control primitives.
5. Hero frame cleanup.
6. Responsive and print pass.

## Verification

- Run `npm run build`.
- Preview key pages:
  - Home
  - Archive
  - Topics
  - A normal article
  - Resume/resume-brief article
- Check light and dark theme.
- Check mobile widths around 480px, 768px, and 900px.
- Check print preview for article and resume layouts.
