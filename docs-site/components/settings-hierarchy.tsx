import type { ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Heading, PanelTop, SlidersHorizontal } from 'lucide-react';
import { GlobalSettingsIcon, WorldSettingsIcon } from '@/lib/icons';

interface Level {
  label: string;
  icon: LucideIcon;
  hint?: string;
  /** Reference page for `label`, which is then shown as a linked interface name. */
  href?: string;
  /** Lookup methods, shown as small code chips under the label. */
  methods?: string[];
}

const iconBox =
  'flex size-8 shrink-0 items-center justify-center rounded-md border bg-fd-secondary text-fd-primary';

// Nests each level inside the one before it, so the indent and guide line show the hierarchy.
function LevelTree({ levels }: { levels: Level[] }) {
  const [level, ...rest] = levels;
  if (!level) return null;
  const Icon = level.icon;

  return (
    <li>
      <div className="flex items-start gap-3 py-1.5">
        <span className={iconBox}>
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col gap-1 leading-tight">
          {level.href ? (
            <Link
              href={level.href}
              className="w-fit font-mono text-sm font-medium text-fd-foreground underline decoration-fd-primary underline-offset-4 hover:text-fd-primary"
            >
              {level.label}
            </Link>
          ) : (
            <span className="text-sm font-medium text-fd-foreground">{level.label}</span>
          )}
          {level.hint ? <span className="text-xs text-fd-muted-foreground">{level.hint}</span> : null}
          {level.methods ? (
            <span className="flex flex-wrap gap-1">
              {level.methods.map((method) => (
                <code
                  key={method}
                  className="rounded border bg-fd-muted px-1.5 py-0.5 font-mono text-xs text-fd-muted-foreground"
                >
                  {method}
                </code>
              ))}
            </span>
          ) : null}
        </span>
      </div>
      {rest.length > 0 ? (
        <ul className="ms-4 border-s ps-4">
          <LevelTree levels={rest} />
        </ul>
      ) : null}
    </li>
  );
}

function TreeCard({
  title,
  summary,
  icon: Icon,
  levels,
}: {
  title: ReactNode;
  summary: string;
  icon: LucideIcon;
  levels: Level[];
}) {
  return (
    <section className="rounded-xl border bg-fd-card p-4 shadow-sm">
      <header className="mb-3 flex items-start gap-3 border-b pb-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-fd-primary text-fd-primary-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold text-fd-foreground">{title}</span>
          <span className="text-sm text-fd-muted-foreground">{summary}</span>
        </span>
      </header>
      <ul>
        <LevelTree levels={levels} />
      </ul>
    </section>
  );
}

const tab: Level = { label: 'Tab', hint: 'A button across the top of the page', icon: PanelTop };
const category: Level = { label: 'Category', hint: 'A heading that groups settings', icon: Heading };
const setting: Level = { label: 'Setting', hint: 'A control the player changes', icon: SlidersHorizontal };

/**
 * The Global and World settings hierarchies side by side, for "How settings are organized".
 *
 * Children are never rendered. The page puts a plain-text tree there so the Markdown version
 * (View as Markdown, Copy Markdown, llms.txt) still shows the hierarchy.
 */
export function SettingsHierarchy(_props: { children?: ReactNode }) {
  return (
    <div className="not-prose my-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <TreeCard
        title="Global settings"
        summary="Belongs to the player and applies in every world."
        icon={GlobalSettingsIcon}
        levels={[tab, category, setting]}
      />
      <TreeCard
        title="World settings"
        summary="Belongs to one world and is chosen by the host."
        icon={WorldSettingsIcon}
        levels={[category, setting]}
      />
    </div>
  );
}

const lookups = (level: string) => [`Get${level}`, `Create${level}`, `GetOrCreate${level}`];

const apiTrees = {
  global: {
    root: 'IModGlobalSettings',
    rootHref: '/docs/reference/global/i-mod-global-settings',
    summary: 'Passed to OnGlobalSettingsLoaded, and available as IGearsMod.GlobalSettings.',
    icon: GlobalSettingsIcon,
    levels: [
      {
        label: 'IGlobalModSettingsTab',
        href: '/docs/reference/global/i-global-mod-settings-tab',
        icon: PanelTop,
        methods: lookups('Tab'),
      },
      {
        label: 'IGlobalModSettingsCategory',
        href: '/docs/reference/global/i-global-mod-settings-category',
        icon: Heading,
        methods: lookups('Category'),
      },
      {
        label: 'IGlobalModSetting',
        href: '/docs/reference/global/i-global-mod-setting',
        icon: SlidersHorizontal,
        methods: lookups('Setting'),
      },
    ],
  },
  world: {
    root: 'IModWorldSettings',
    rootHref: '/docs/reference/world/i-mod-world-settings',
    summary: 'Passed to OnWorldSettingsLoaded, and available as IGearsMod.WorldSettings.',
    icon: WorldSettingsIcon,
    levels: [
      {
        label: 'IWorldModSettingsCategory',
        href: '/docs/reference/world/i-world-mod-settings-category',
        icon: Heading,
        methods: lookups('Category'),
      },
      {
        label: 'IWorldModSetting',
        href: '/docs/reference/world/i-world-mod-setting',
        icon: SlidersHorizontal,
        methods: lookups('Setting'),
      },
    ],
  },
} satisfies Record<string, { root: string; rootHref: string; summary: string; icon: LucideIcon; levels: Level[] }>;

/**
 * The C# interfaces for one kind of setting, from the root the mod receives down to a setting, with
 * the methods that look up each level on its parent.
 *
 * Children are never rendered, for the same reason as in `SettingsHierarchy`.
 */
export function SettingsApiTree({ kind }: { kind: keyof typeof apiTrees; children?: ReactNode }) {
  const tree = apiTrees[kind];
  return (
    <div className="not-prose my-6">
      <TreeCard
        title={
          <Link
            href={tree.rootHref}
            className="font-mono underline decoration-fd-primary underline-offset-4 hover:text-fd-primary"
          >
            {tree.root}
          </Link>
        }
        summary={tree.summary}
        icon={tree.icon}
        levels={tree.levels}
      />
    </div>
  );
}
