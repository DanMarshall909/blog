export const heroImageOverrides = new Map<string, string>();

const articleFallbackImages = [
  '/articles/ai-blog-pipeline/cartoon.png',
  '/articles/1bit-llm/cartoon.png',
  '/articles/claude-code-mcp-token-waste/cartoon.png',
  '/articles/bankers-rounding/cartoon.png',
];

export function getArticleSlug(articleId: string): string {
  return articleId.replace(/\/index$/, '');
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function getArticleCardImage(
  articleId: string,
  heroImage: string | undefined,
  fallbackIndex = 0,
): string {
  return (
    heroImageOverrides.get(articleId) ??
    heroImage ??
    articleFallbackImages[fallbackIndex % articleFallbackImages.length]
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function markdownInlineToHtml(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

export function getIntroHtml(description: string | undefined, body: string): string {
  if (description?.trim()) {
    return `<p>${escapeHtml(description.trim())}</p>`;
  }

  const paragraphLines: string[] = [];

  for (const line of body.split('\n')) {
    const trimmed = line.trim();

    if (/^#{1,6}\s/.test(trimmed)) continue;
    if (trimmed === '---') continue;
    if (/^!\[/.test(trimmed)) continue;

    if (trimmed === '' && paragraphLines.length > 0) break;
    if (trimmed !== '') paragraphLines.push(trimmed);
  }

  if (paragraphLines.length === 0) {
    return '';
  }

  return `<p>${markdownInlineToHtml(paragraphLines.join(' '))}</p>`;
}
