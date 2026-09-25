import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { MediaSlot } from '@/components/media-slot';
import { showcaseMods, type ShowcaseMod } from '@/content/mod-showcase';

import supportsGearsBadge from '@/public/images/Supports-Gears-badge.png';

export const metadata: Metadata = {
  title: 'Mod Showcase',
  description: 'Mods for 7 Days to Die that use Gears for their settings.',
};

const guideUrl = '/docs/mod-showcase';

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

      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {showcaseMods.map((mod) => (
          <ModTile key={mod.url} mod={mod} />
        ))}
        <AddYourModTile />
      </div>
    </main>
  );
}

function ModTile({ mod }: { mod: ShowcaseMod }) {
  return (
    <a
      href={mod.url}
      rel="noreferrer noopener"
      target="_blank"
      className="group relative aspect-16/9 overflow-hidden rounded-xl border border-dashed border-fd-muted-foreground/60"
    >
      {/*
        `ratio` only shapes the placeholder shown while the image is missing. Here it stretches the
        placeholder over the tile instead of giving it a shape of its own.
      */}
      <MediaSlot
        title={mod.image}
        alt={mod.imageAlt}
        ratio="absolute inset-0"
        className="absolute inset-0 size-full object-cover transition-all group-hover:brightness-125"
      >
        Image for {mod.name}
      </MediaSlot>
      <div className="absolute inset-x-0 bottom-0 z-2 bg-fd-background px-4 py-2">
        <p className="text-sm font-medium">{mod.name}</p>
        <p className="line-clamp-2 text-xs text-fd-muted-foreground" title={mod.description}>
          {mod.description}
        </p>
      </div>
    </a>
  );
}

// Always last in the grid, so the page still has somewhere to go while the list is empty.
function AddYourModTile() {
  return (
    <Link
      href={guideUrl}
      className="flex aspect-16/9 flex-col rounded-xl border border-dashed border-fd-muted-foreground/60 p-4 transition-all hover:bg-fd-accent"
    >
      <p className="mb-2 font-mono text-xs text-fd-muted-foreground">Your mod here</p>
      <p className="text-xl font-medium">Add your mod to the showcase</p>
      <p className="mt-auto text-sm text-fd-muted-foreground">
        Open a pull request with your mod&apos;s name, description, image, and link.
      </p>
    </Link>
  );
}
