/**
 * The mods shown on the Mod Showcase page (`app/(home)/showcase/page.tsx`), in the order listed.
 *
 * To add a mod:
 *
 * 1. Put its image in `public/images/showcase/`, named `<Mod-Name>.png`. Use a 16:9
 *    image. Cards shrink any other shape to fit whole, leaving empty space around it.
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
  /**
   * File name of the image in `public/images/showcase/`, such as `My-Mod.png`. Write
   * the file name only. The page adds the folder.
   */
  image: string;
  /** Alt text. Say what the reader should see in the image. */
  imageAlt: string;
  /** Where the card links, such as the mod's Nexus Mods or GitHub page. */
  url: string;
  /** Whether the mod has global settings, which players change from the main menu or in game. */
  globalSettings: boolean;
  /** Whether the mod has world settings, which are set per world and fixed while it runs. */
  worldSettings: boolean;
};

export const showcaseMods: ShowcaseMod[] = [
  {
    name: 'Quartz',
    description: 'Quartz is a UI modding framework for 7 Days to Die. It adds new XUi Widgets and XUi Controllers that give modders more freedom on creating new and powerful UIs for 7 Days to Die.',
    image: 'Quartz.png',
    imageAlt: 'The Quartz logo: a blue crystal beside the word QUARTZ in blue capital letters',
    url: 'https://www.nexusmods.com/7daystodie/mods/2409',
    globalSettings: true,
    worldSettings: false,
  },
  {
    name: 'Torch',
    description: "Torch is a 7 Days to Die mod which works to optimize one of the game's most inefficient areas -- the lighting engine. It is designed to improve lighting quality and frame rates in situtations where there are many lights in an area in game, it does so without compromising on how the game looks.",
    image: 'Torch.png',
    imageAlt: 'The Torch logo: the word TORCH in black capital letters, with a lit wall torch showing through the first letters',
    url: 'https://www.nexusmods.com/7daystodie/mods/3287',
    globalSettings: true,
    worldSettings: false,
  },
  {
    name: 'Hostile Architecture',
    description: 'Hostile Architecture is a 7 Days to Die mod that makes fortifications realistic: material hardness affects how much damage enemies can deal to blocks, while hard surfaces can hurt attackers in return.',
    image: 'Hostile-Architecture.png',
    imageAlt: 'The Hostile Architecture logo: A steel wall bearing the words HOSTILE ARCHITECTURE, with fallen zombies in the foreground.',
    url: 'https://www.nexusmods.com/7daystodie/mods/9902',
    globalSettings: true,
    worldSettings: false,
  },
];
