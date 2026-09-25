import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions, discordLink } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return <HomeLayout 
    {...baseOptions()}
    // This replaces the links from baseOptions rather than adding to them, so the player-facing
    // section and the Discord icon have to be repeated here to reach the landing page's header.
    links={[
      { text: 'Getting Started', url: '/docs/getting-started' },
      { text: 'Documentation', url: '/docs' },
      { text: 'API Reference', url: '/docs/reference' },
      { text: 'For Players', url: '/docs/players', active: 'nested-url' },
      { text: 'Mod Showcase', url: '/showcase' },
      discordLink,
    ]}
    >
      {children}
    </HomeLayout>;
}
