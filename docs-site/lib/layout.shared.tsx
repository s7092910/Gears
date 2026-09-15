import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
    },
    links: [ 
        { text: 'Getting Started', url: '/docs/getting-started' },
        { text: 'Documentation', url: '/docs' },
        { text: 'API Reference', url: '/docs/reference' }
      ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
