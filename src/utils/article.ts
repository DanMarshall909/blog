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
