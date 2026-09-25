import fs from 'node:fs';
import path from 'node:path';
import Image, { type StaticImageData } from 'next/image';
import { ImageIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const publicDir = path.join(process.cwd(), 'public');

/**
 * A screenshot or GIF that may not have been captured yet.
 *
 * If the file exists under `public/`, this renders it. If it does not, it renders a dashed frame
 * holding the space and printing the capture brief, so whoever records the shot knows what it has
 * to show. Dropping the file into `public/images/` is the only step needed to swap one for the
 * other — nothing here has to change.
 *
 * `check-links.mjs` does not walk the landing page and does not know about this component, so
 * nothing will warn you that a slot is still empty. Search for `MediaSlot` to find the ones left.
 */
export async function MediaSlot({
  title,
  alt,
  ratio = 'aspect-16/9',
  className = 'h-auto w-full rounded-xl border border-fd-border',
  children,
}: {
  /** Path under `public`, written from the site root, such as `/images/Home-Hero.gif`. */
  title: string;
  /** Alt text, used once the file exists. Say what the reader should see in it. */
  alt: string;
  /** Tailwind aspect-ratio class shaping the placeholder. Ignored once the file exists. */
  ratio?: string;
  /** Classes for the rendered image, once the file exists. Replaces the default framed style. */
  className?: string;
  /** What the shot needs to show. */
  children: ReactNode;
}) {
  const image = await loadImage(title);

  if (image) {
    return (
      <Image
        src={image}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-fd-border bg-fd-muted/30 p-6 text-center ${ratio}`}
    >
      <ImageIcon className="size-6 shrink-0 text-fd-muted-foreground" />
      <p className="font-mono text-xs text-fd-foreground">{title}</p>
      {/*
        A div, not a p: in MDX the brief arrives already wrapped in its own paragraph, and a p
        inside a p is invalid, so the browser would split them and drop these styles.
      */}
      <div className="max-w-prose text-sm text-fd-muted-foreground [&_p]:my-0">{children}</div>
    </div>
  );
}

/**
 * Resolves a path under `public` to a static import, or null when the file is not there.
 *
 * The import has to go through a template literal so the bundler builds a context over
 * `public/images` and hands back real `StaticImageData` — width, height, and the `/Gears` base path
 * already applied. A plain string `src` would need the base path adding by hand, which is the one
 * thing CONTENT_GUIDE.md tells authors never to do.
 */
async function loadImage(src: string): Promise<StaticImageData | null> {
  const name = src.replace(/^\/images\//, '');

  // Guard the context import: a miss inside it is a runtime throw, and a name that escapes the
  // directory should never reach the bundler in the first place.
  if (name.includes('/') || name.includes('\\') || !fs.existsSync(path.join(publicDir, src))) {
    return null;
  }

  const loaded = (await import(`@/public/images/${name}`)) as { default: StaticImageData };
  return loaded.default;
}
