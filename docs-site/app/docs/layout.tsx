import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { SidebarSection } from '@/components/sidebar-section';

// The two audiences, each with its own sidebar. `content/docs/players` is a root folder, so the
// sidebar prunes to it inside that section; these tabs are what switches between the two. The
// active tab is the last one whose url prefixes the current path, so the modder docs at the
// shallower `/docs` must come first.
const tabs = [
  {
    title: 'Documentation',
    description: 'Add settings to your mod',
    url: '/docs',
  },
  {
    title: 'For Players',
    description: 'Install Gears and change mod settings',
    url: '/docs/players',
  },
];

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      tabs={tabs}
      sidebar={{ components: { Separator: SidebarSection } }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
