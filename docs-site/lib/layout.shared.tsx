import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
    },
    // Header only: `on: 'nav'` keeps this out of the sidebar menu, where the section already has
    // its own entry in the tab dropdown.
    links: [
      {
        text: 'For Players',
        url: '/docs/players',
        active: 'nested-url',
        on: 'nav',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
