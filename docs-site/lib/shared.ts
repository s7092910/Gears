import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Gears';

// GitHub Pages project site: the repo name is part of the path.
export const siteUrl = 'https://s7092910.github.io/Gears';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 's7092910',
  repo: 'Gears',
  branch: 'main',
};

// The docs site is a subdirectory of the repo, so page paths need this prefix
// to resolve against GitHub.
export const repoContentPath = 'docs-site/content/docs';

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: getImageUrl(segments, page.locale) };
}
