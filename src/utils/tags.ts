export const SANCTIONED_TAGS = [
  'ai',
  'ai assisted development',
  'career',
  'developer tools',
  'dotnet',
  'finance',
  'llm',
  'local ai',
  'productivity',
  'static sites',
  'tdd',
  'testing',
] as const;

export type SanctionedTag = typeof SANCTIONED_TAGS[number];

export function tagSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/#/g, 'sharp')
    .replace(/\+/g, 'plus')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function tagHref(tag: string): string {
  return `/tags/${tagSlug(tag)}/`;
}
