import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Globe, Map as MapIcon, Plus, type LucideIcon } from 'lucide-react';
import { MediaSlot } from '@/components/media-slot';
import { ShowcaseGrid } from '@/components/showcase-grid';
import { showcaseMods, type ShowcaseMod } from '@/content/mod-showcase';

import supportsGearsBadge from '@/public/images/Supports-Gears-badge.png';

export const metadata: Metadata = {
  title: 'Mod Showcase',
  description: 'Mods for 7 Days to Die that use Gears for their settings.',
};

const guideUrl = '/docs/mod-showcase';

// Every card image lives here. Entries in content/mod-showcase.ts give the file name only.
const imageFolder = '/images/showcase';

// Mods are listed in content/mod-showcase.ts. Add new ones there, not here.
export default function ModShowcasePage() {
  return (
    <main className="mx-auto w-full max-w-350 px-4 py-12">
      <div className="relative overflow-hidden rounded-xl border border-dashed border-fd-muted-foreground/60 p-6 md:pb-16">
        <div className="relative z-2 max-w-xl">
          <h1 className="mb-4 text-xl font-medium">Mod Showcase</h1>
          <p className="text-fd-muted-foreground">
            Mods that use Gears for their settings. Select a mod to open its page.
          </p>
          <div className="mt-6">
            <Link
              href={guideUrl}
              className="inline-flex h-10 items-center justify-center rounded-md border border-fd-border px-4 py-2 text-sm font-medium transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <Plus className="me-2 size-4" />
              Add Your Mod
            </Link>
          </div>
        </div>
        <span className="absolute bottom-6 left-6 font-mono text-xs text-fd-muted-foreground max-md:hidden">
          Showcase
        </span>
        {/*
          The badge's "SUPPORTS" lettering is light silver on a transparent background, so it
          disappears against the light theme's white. There the badge gets a thin dark outline,
          which the dark theme doesn't need.
        */}
        <Image
          src={supportsGearsBadge}
          alt=""
          className="pointer-events-none absolute top-1/2 right-6 hidden w-80 -translate-y-1/2 select-none [filter:drop-shadow(0_0_1px_rgb(0_0_0/0.9))_drop-shadow(0_0_1px_rgb(0_0_0/0.9))] lg:block dark:[filter:none]"
        />
      </div>

      <ShowcaseGrid
        items={showcaseMods.map((mod) => ({
          key: mod.url,
          name: mod.name,
          description: mod.description,
          globalSettings: mod.globalSettings,
          worldSettings: mod.worldSettings,
          tile: <ModTile mod={mod} />,
        }))}
        trailing={<AddYourModTile />}
      />
    </main>
  );
}

function ModTile({ mod }: { mod: ShowcaseMod }) {
  return (
    <a
      href={mod.url}
      rel="noreferrer noopener"
      target="_blank"
      className="group flex flex-col overflow-hidden rounded-xl border border-dashed border-fd-muted-foreground/60"
    >
      <div className="relative aspect-16/9 overflow-hidden">
        {/*
          `ratio` only shapes the placeholder shown while the image is missing. Here it stretches the
          placeholder over the image area instead of giving it a shape of its own.

          `object-contain` shrinks an image that isn't 16:9 to fit whole, rather than cropping it.
          The page background shows through the space beside or above it.
        */}
        <MediaSlot
          title={`${imageFolder}/${mod.image}`}
          alt={mod.imageAlt}
          ratio="absolute inset-0"
          className="absolute inset-0 size-full object-contain transition-all group-hover:brightness-125"
        >
          Image for {mod.name}
        </MediaSlot>
        {(mod.globalSettings || mod.worldSettings) && (
          <ul className="absolute top-2 left-2 z-2 flex flex-wrap gap-1.5">
            {mod.globalSettings && (
              <SettingsTag icon={Globe} title="Players change these from the main menu or in game.">
                Global settings
              </SettingsTag>
            )}
            {mod.worldSettings && (
              <SettingsTag
                icon={MapIcon}
                title="Set for each world. They can't change while the world runs."
              >
                World settings
              </SettingsTag>
            )}
          </ul>
        )}
      </div>
      <div className="min-h-24 flex-1 border-t border-dashed border-fd-muted-foreground/60 bg-fd-background px-4 py-3">
        <p className="mb-1 text-sm font-medium">{mod.name}</p>
        <p className="line-clamp-3 text-xs text-fd-muted-foreground" title={mod.description}>
          {mod.description}
        </p>
      </div>
    </a>
  );
}

function SettingsTag({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <li
      title={title}
      className="inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-background/90 px-1.5 py-0.5 text-xs font-medium"
    >
      <Icon className="size-3" aria-hidden />
      {children}
    </li>
  );
}

// Always last in the grid, so the page still has somewhere to go while the list is empty. The grid
// stretches it to the height of the mod cards in its row; the minimum height covers an empty list.
function AddYourModTile() {
  return (
    <Link
      href={guideUrl}
      className="flex min-h-64 flex-col rounded-xl border border-dashed border-fd-muted-foreground/60 p-4 transition-all hover:bg-fd-accent"
    >
      <p className="mb-2 font-mono text-xs text-fd-muted-foreground">Your mod here</p>
      <p className="text-xl font-medium">Add your mod to the showcase</p>
      <p className="mt-auto text-sm text-fd-muted-foreground">
        Open a pull request with your mod&apos;s name, description, image, and link.
      </p>
    </Link>
  );
}
