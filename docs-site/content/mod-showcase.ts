/**
 * The mods shown on the Mod Showcase page (`app/(home)/showcase/page.tsx`), in the order listed.
 *
 * To add a mod:
 *
 * 1. Put its image in `public/images/`, named `Mod-Showcase-<Mod-Name>.png`. No subfolders — the
 *    image loader only looks directly inside `public/images/`. Cards crop images to 16:9.
 * 2. Add an entry below.
 *
 * A missing image does not break the build. The card shows a dashed placeholder instead, so check
 * the page after adding one.
 */
export type ShowcaseMod = {
  /** Mod name, shown as the card title. */
  name: string;
  /** One or two plain sentences on what the mod does. */
  description: string;
  /** Image under `public`, written from the site root, such as `/images/Mod-Showcase-My-Mod.png`. */
  image: string;
  /** Alt text. Say what the reader should see in the image. */
  imageAlt: string;
  /** Where the card links, such as the mod's Nexus Mods or GitHub page. */
  url: string;
};

export const showcaseMods: ShowcaseMod[] = [
  // {
  //   name: 'My Mod',
  //   description: 'Adds a configurable loot multiplier, set from the Mods menu.',
  //   image: '/images/Mod-Showcase-My-Mod.png',
  //   imageAlt: "My Mod's settings page in the Mods menu",
  //   url: 'https://www.nexusmods.com/7daystodie/mods/0000',
  // },
];
