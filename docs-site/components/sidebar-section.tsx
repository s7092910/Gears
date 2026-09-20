'use client';

import type * as PageTree from 'fumadocs-core/page-tree';

/**
 * The `---Name---` entries in `content/docs/meta.json`, drawn as section headings.
 *
 * Fumadocs' own separator is muted text the same size as the links under it, which leaves the
 * sidebar reading as one long list. This gives each section a rule above it and a heading in the
 * foreground colour, so the groups are visible while scanning.
 */
export function SidebarSection({ item }: { item: PageTree.Separator }) {
  return (
    <p
      className="mt-7 mb-2 flex items-center gap-2 border-t border-fd-border px-2 pt-5 text-sm font-semibold text-fd-foreground first:mt-0 first:border-t-0 first:pt-0 [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {item.icon}
      {item.name}
    </p>
  );
}
