**Comparison target**

- Source visual truth: https://claude.ai/artifact/MUrCzaNqDdUmL6Q6vYzoGi#1d (the `1D Ink` panel).
- Implementations: http://127.0.0.1:3001/, http://127.0.0.1:3001/archive/, and http://127.0.0.1:3001/articles/oidc-wont-stop-the-next-litellm/.
- Evidence: the archive, home, and article routes were captured in Chrome at 2480 × 1458 CSS pixels, device scale factor 1, desktop default state. The source is a four-direction board, so comparison was scoped to its 1D Ink panel rather than its surrounding board chrome.

**Findings**

- No remaining P0, P1, or P2 differences.
- [P3] The live archive contains 18 current entries rather than the reference board's 16 historical entries.
  Location: archive list.
  Evidence: the implementation uses the repository collection as its source of truth.
  Impact: expected content difference; it preserves the real, current archive.

**Required fidelity surfaces**

- Fonts and typography: Archivo is loaded through the shared layout; title, navigation, row titles, and compact metadata use the same grotesque hierarchy, heavy title weight, and uppercase tracking direction as Ink across home, archive, topics, and articles.
- Spacing and layout rhythm: the 11.25rem rail, 45rem content column, hairline rules, flattened zero-radius surfaces, and compact row rhythm match the reference composition.
- Colors and visual tokens: warm near-black canvas, muted warm-gray copy/rules, and red labels/active nav accent are shared by all routes through `Layout` and the Ink token layer.
- Image quality and asset fidelity: Ink contains no illustrations, logos, thumbnails, or non-standard icons; none were substituted.
- Copy and content: reference heading/copy is retained; list data is current repository content.

**Comparison history**

1. Initial local capture showed a visible `2026` heading in the primary list that the Ink reference keeps only in the side rail. Fixed by making the per-year headings screen-reader-only while retaining their anchor targets.
2. Final Chrome captures confirmed the rail-only year treatment, dark flattened canvas, compact ruled rows, aligned shared header, and the same system on the home and article routes.

**Implementation Checklist**

- [x] Shared Ink system applied through `Layout`, `ArticleCard`, and `ArticleListView` consumers.
- [x] Dedicated Ink archive template with live article links and year anchors.
- [x] Topic rail links to the existing topics route.
- [x] Responsive rail arrangement for narrow viewports.
- [x] Browser acceptance test passed: `npm test -- tests/ink-archive.spec.ts`.
- [x] Production build passed: `npm run build`.

final result: passed
