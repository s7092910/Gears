import { renderOGImage } from '@/lib/og';

export const revalidate = false;

/** The card for the landing page, which has no page tree entry to take a title from. */
export function GET() {
  return renderOGImage({
    title: 'Give your mod a settings page',
    eyebrow: 'Mod settings for 7 Days to Die',
  });
}
