import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return <HomeLayout 
    {...baseOptions()}
    links={[ 
      { text: 'Getting Started', url: '/docs/getting-started' },
      { text: 'Documentation', url: '/docs' },
      { text: 'API Reference', url: '/docs/reference' }
    ]}
    >
      {children}
    </HomeLayout>;
}
