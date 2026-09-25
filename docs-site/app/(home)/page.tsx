import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { MediaSlot } from '@/components/media-slot';
import { gitConfig } from '@/lib/shared';
import type { ReactNode } from 'react';

import settingTabs from '@/public/images/Setting-Tabs.png';
import selectorSetting from '@/public/images/Selector-Setting.png';
import sliderSetting from '@/public/images/Slider-Setting.png';
import switchSetting from '@/public/images/Switch-Setting.png';
import colorSetting from '@/public/images/Color-Setting.png';
import bindingSetting from '@/public/images/Control-Binding-Setting.png';
import supportsGearsBadge from '@/public/images/Supports-Gears-badge.png';

const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

// Where players download Gears itself, as opposed to where modders read about it.
const nexusUrl = 'https://www.nexusmods.com/7daystodie/mods/4017';

const modSettingsXml = `<?xml version="1.0" encoding="utf-8"?>
<ModSettings version="2">
	<Global>
		<Tab name="General" displayKey="myModTabGeneral">
			<Category name="Display" displayKey="myModCatDisplay">
				<Selector name="Units" displayKey="myModUnits" type="string" defaultValue="metric">
					<List allowedValues="metric,imperial" />
				</Selector>

				<Switch name="ShowHints" displayKey="myModShowHints" type="bool" defaultValue="true" />
			</Category>
		</Tab>
	</Global>
</ModSettings>`;

const patchXml = `<configs>
	<conditional>
		<if cond="modsetting('MyMod', 'Global', 'General.Display.ShowHints') == 'True'">
			<set xpath="/hints/@enabled">true</set>
		</if>
	</conditional>
</configs>`;

const modCs = `// MyHud is your own class. Gears knows nothing about it.
public class MyModGears : IGearsModApi
{
    public void InitMod(IGearsMod modInstance)
    {
        modInstance.GlobalSettings.BindSettingsClass(typeof(Global));
    }

    public void OnGlobalSettingsLoaded(IModGlobalSettings modSettings)
    {
        modSettings.SyncSettingsToClass(typeof(Global));
    }

    public void OnWorldSettingsLoaded(IModWorldSettings worldSettings) { }

    private static class Global
    {
        // Gears finds the setting and assigns it to the field.
        [Setting("General.Display.ShowHints")]
        public static ISwitchGlobalSetting<bool> ShowHints;

        // Called whenever the player applies a change, and once at startup
        // with the saved value, because of includeInSync.
        [SettingOnValueChanged("General.Display.ShowHints", includeInSync: true)]
        private static void ShowHintsChanged(IValueModSetting<bool> setting, bool newValue)
        {
            MyHud.HintsVisible = newValue;
        }
    }
}`;

// Shared button styles. Primary is the one action a section wants most; secondary is the rest.
const primaryButton =
  'inline-flex justify-center rounded-full bg-fd-primary px-5 py-3 font-medium tracking-tight text-fd-primary-foreground transition-opacity hover:opacity-90 max-sm:text-sm';
const secondaryButton =
  'inline-flex justify-center rounded-full border border-fd-border bg-fd-secondary px-5 py-3 font-medium tracking-tight text-fd-secondary-foreground transition-colors hover:bg-fd-accent max-sm:text-sm';

// A field of brand-colored dots, used as a texture behind panels.
const dotPattern =
  'bg-[radial-gradient(var(--color-fd-primary)_1.5px,transparent_1.5px)] bg-size-[10px_10px]';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col pb-12">
      <Hero />
      <div className="mx-auto mt-10 grid w-full max-w-350 grid-cols-1 gap-10 px-6 md:px-12 lg:mt-14 lg:grid-cols-2">
        <Intro />
        <XmlOrCsharp />
        <Showcase />
        <WhyGears />
        <SettingTypes />
        <GlobalAndWorld />
        <GetStarted />
      </div>
    </main>
  );
}

function Hero() {
  return (
    <div className="px-4 pt-4">
      <div className="relative mx-auto flex h-[70vh] max-h-225 min-h-150 w-full max-w-350 flex-col overflow-hidden rounded-2xl border border-fd-border bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--color-fd-primary)_22%,transparent),transparent_65%)]">
        {/* Decoration only: a dotted disc behind the headline, fading out toward its lower edge. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-16 right-[12%] size-95 rounded-full bg-[radial-gradient(var(--color-fd-primary)_2.5px,transparent_2.5px)] bg-size-[8px_8px] [mask-image:radial-gradient(circle_at_35%_30%,black_20%,transparent_75%)] max-md:hidden"
        />

        <div className="relative z-2 flex flex-col px-4 md:p-12 max-md:items-center max-md:text-center">
          <p className="mt-12 w-fit rounded-full border border-fd-primary/50 p-2 text-xs font-medium text-fd-primary">
            Mod settings for 7 Days to Die
          </p>
          <h1 className="my-8 text-4xl leading-tight font-medium xl:mb-12 xl:text-5xl">
            Give your mod a
            <br />
            <span className="text-fd-primary">settings page</span>.
          </h1>
          <div className="flex w-fit flex-row flex-wrap items-center justify-center gap-4">
            <Link href="/docs/getting-started" className={primaryButton}>
              Get Started
            </Link>
            <Link href="/docs" className={secondaryButton}>
              Documentation
            </Link>
          </div>
          <p className="mt-6 text-sm text-fd-muted-foreground">Gears 8.0.0 · GearsAPI.dll 3.0.0</p>
        </div>

        {/* Overflows the box's lower-right corner on wide screens; the box clips it. */}
        <div className="relative z-1 mt-12 px-4 md:absolute md:top-100 md:left-[20%] md:mt-0 md:w-300 md:px-0">
          <MediaSlot
            title="/images/Home-Hero.png"
            alt="A mod's settings page in the Mods menu, with a player stepping a Selector and dragging a Slider"
            className="h-auto w-full rounded-xl border-2 border-fd-border shadow-2xl"
          >
            The Mods window open on a mod&apos;s settings page: the tab row, a category heading, and
            four or five rows of different types, with the description pane filled on the right. Step
            one Selector and drag one Slider so the rows respond and the Apply button lights up. 3–5
            seconds, looping, at least 1280 wide, whole window in frame. A still of the same view
            works if a GIF is awkward.
          </MediaSlot>
        </div>
      </div>
    </div>
  );
}

function Intro() {
  return (
    <p className="col-span-full text-2xl leading-snug font-light tracking-tight md:text-3xl xl:text-4xl">
      Gears is a <Brand>mod settings framework</Brand> for <Brand>7 Days to Die</Brand>. It draws
      your mod&apos;s settings in the game&apos;s own <Brand>Mods menu</Brand>, saves what the player
      picks, sends per-world values to every client, and hands those values back to your{' '}
      <Brand>XML patches</Brand> and your <Brand>C#</Brand>.
    </p>
  );
}

function XmlOrCsharp() {
  return (
    <div className="relative z-2 col-span-full overflow-hidden rounded-2xl bg-fd-primary/15 p-4 md:p-8">
      <div aria-hidden className={`absolute inset-0 -z-1 opacity-40 ${dotPattern}`} />
      <div className="mx-auto w-full max-w-200 rounded-2xl border border-fd-border bg-fd-card p-4 text-fd-card-foreground shadow-lg md:p-6">
        <div className="mb-4 flex flex-row flex-wrap items-center gap-3">
          <h2 className="w-fit rounded-xl border-2 border-fd-primary/50 px-2 font-mono font-bold text-fd-primary uppercase">
            XML or C#
          </h2>
          <p className="text-sm text-fd-muted-foreground">
            Declaring settings takes no code at all. Reach for C# when you want typed values and
            callbacks.
          </p>
        </div>

        <Tabs items={['XML only', 'XML plus C#']}>
          <Tab value="XML only">
            <p className="mb-4 text-sm text-fd-muted-foreground">
              Put a <code>ModSettings.xml</code> next to your <code>ModInfo.xml</code> and Gears builds
              the page from it. You write no C# and reference no assembly.
            </p>
            <DynamicCodeBlock lang="xml" code={modSettingsXml} />
            <p className="mt-6 mb-4 text-sm text-fd-muted-foreground">
              Read the value back in any of your <code>Config/*.xml</code> patches with{' '}
              <code>modsetting()</code>.
            </p>
            <DynamicCodeBlock lang="xml" code={patchXml} />
          </Tab>
          <Tab value="XML plus C#">
            <p className="mb-4 text-sm text-fd-muted-foreground">
              Reference <code>GearsAPI.dll</code> and implement one interface. Gears hands your code the
              typed settings at startup and again whenever the player applies a change.
            </p>
            <DynamicCodeBlock lang="csharp" code={modCs} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

function WhyGears() {
  return (
    <>
      <SectionHeading
        title="Why not a config file"
        lead="Every mod needs somewhere to keep its options. Here is what Gears does that a file in your mod folder does not."
      />

      <FeatureCard title="Players never edit a file">
        <p>
          A config file means alt-tabbing, finding the mod folder, editing XML by hand, and no
          feedback at all when a typo breaks it. Gears draws the settings in the Mods menu, saves what
          the player picks, and restores it the next time the game starts.
        </p>
        <CardImage>
          <MediaSlot
            title="/images/Mods-Menu.png"
            alt="The Mods window listing installed mods, with one selected"
            ratio="aspect-16/10"
            className={cardImageClass}
          >
            The Mods window with several mods listed down the left and one selected, so a reader sees
            where a player finds any of this. Crop to the window.
          </MediaSlot>
        </CardImage>
      </FeatureCard>

      <FeatureCard title="One host picks, every client gets it">
        <p>
          A config file belongs to one install. The host chooses a world&apos;s settings on the New
          Game screen, Gears writes them into the save, and every client that joins receives the same
          values.
        </p>
        <CardImage>
          <MediaSlot
            title="/images/World-Settings.png"
            alt="A mod's world settings category on the New Game screen"
            ratio="aspect-16/10"
            className={wideCardImageClass}
          >
            The New Game screen&apos;s world settings page showing one mod&apos;s world category and
            two or three rows, making it obvious these are picked at world creation rather than in the
            Mods menu.
          </MediaSlot>
        </CardImage>
      </FeatureCard>

      <FeatureCard title="You would be writing UI, not gameplay">
        <p>
          Building this yourself means a control for each setting type, a saved-values file and the
          code that restores it, localization lookups, per-world serialization, the server-to-client
          handoff, and a rebinding row that behaves like the game&apos;s own Controls screen. That is
          what Gears already is.
        </p>
      </FeatureCard>
      <FeatureCard title="Gears stays optional">
        <p>
          Ship <code>GearsAPI.dll</code> in your own mod folder and your mod still loads for a player
          who does not have Gears installed. They see no settings page, and the patches that read a
          setting do not apply.
        </p>
        <div className="mt-6">
          <Link href="/docs/csharp/getting-started" className={secondaryButton}>
            Get Started with C#
          </Link>
        </div>
      </FeatureCard>
    </>
  );
}

const settingTypes: { name: string; image: StaticImageData; description: string }[] = [
  {
    name: 'Selector',
    image: selectorSetting,
    description:
      'One value at a time, with arrows to step through a fixed list. Use it for quality levels, modes, or a handful of numbers.',
  },
  {
    name: 'Slider',
    image: sliderSetting,
    description:
      'A bar the player drags for a number in a range. Use it when the rough position matters more than the exact figure.',
  },
  {
    name: 'Switch',
    image: switchSetting,
    description:
      'Two buttons, and the lit one is the current value. Use it to turn something on or off, or for any either-or choice.',
  },
  {
    name: 'Color',
    image: colorSetting,
    description:
      "Opens the game's own color picker and shows the result as a swatch. Use it for anything the player might want to tint.",
  },
  {
    name: 'Binding',
    image: bindingSetting,
    description:
      "A row where the player rebinds one of your mod's controls, using the same control as the game's Controls screen.",
  },
];

function SettingTypes() {
  return (
    <div className="col-span-full mt-4">
      <h2 className="mb-8 text-center text-4xl font-medium tracking-tight text-fd-primary">
        Five setting types
      </h2>
      <p className="mx-auto mb-8 w-full max-w-200 text-center">
        Tabs and categories group them, and each one is a row the player reads and changes without
        leaving the game.
      </p>

      <div className="mx-auto mb-8 max-w-200 overflow-hidden rounded-xl border border-fd-border shadow-lg">
        <Image src={settingTabs} alt="A row of setting tabs across the top of a mod's settings page" />
      </div>

      <Tabs items={settingTypes.map((type) => type.name)}>
        {settingTypes.map((type) => (
          <Tab key={type.name} value={type.name}>
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-fd-border shadow-sm">
                <Image src={type.image} alt={`A ${type.name} setting as it appears in the game`} />
              </div>
              <div className="max-lg:row-start-1">
                <h3 className="my-4 text-xl font-medium tracking-tight lg:text-2xl">{type.name}</h3>
                <p>{type.description}</p>
              </div>
            </div>
          </Tab>
        ))}
      </Tabs>

      <p className="mx-auto mt-8 max-w-200 text-center text-sm text-fd-muted-foreground">
        Every type also takes a caption, a description, preview images shown as the value changes,
        localization keys for its labels, and a warning when a change needs a world reload or a game
        restart. See{' '}
        <Link href="/docs/setting-types" className="font-medium underline underline-offset-4">
          Choose a Setting Type
        </Link>
        .
      </p>
    </div>
  );
}

function GlobalAndWorld() {
  return (
    <>
      <SectionHeading
        title="Two kinds of setting"
        lead="Where a value is stored, and who gets to change it, is the one decision to make per setting."
      />

      <FeatureCard title="Global settings">
        <p>
          A <strong>global setting</strong> belongs to the player. They change it from the main menu or
          the in-game menu, the value applies in every world, and Gears saves it to one file shared by
          every mod.
        </p>
      </FeatureCard>
      <FeatureCard title="World settings">
        <p>
          A <strong>world setting</strong> belongs to one world. The host picks it when creating or
          continuing that world, every client that joins receives it, and it cannot be changed while
          the world is running.
        </p>
      </FeatureCard>
    </>
  );
}

function Showcase() {
  return (
    <>
      <FeatureCard title="Mods that use Gears">
        <p>
          The Mod Showcase lists mods that give players a settings page with Gears. Each one links to
          the mod&apos;s own page. To list yours, open a pull request with its name, description,
          image, and link.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/showcase" className={primaryButton}>
            Mod Showcase
          </Link>
          <Link href="/docs/mod-showcase" className={secondaryButton}>
            Add Your Mod
          </Link>
        </div>
      </FeatureCard>
      {/* The badge's silver lettering needs a dark backdrop, so this panel is dark in both themes. */}
      <BrandPanel tone="dark">
        <Image
          src={supportsGearsBadge}
          alt="The Supports Gears badge"
          className="relative h-auto w-full max-w-100"
        />
      </BrandPanel>
    </>
  );
}

function GetStarted() {
  return (
    <div className="relative col-span-full overflow-hidden rounded-2xl border border-fd-border bg-fd-card p-8 text-center shadow-lg md:p-12">
      <div
        aria-hidden
        className={`absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] ${dotPattern}`}
      />
      <div className="relative flex flex-col items-center">
        <h2 className="text-3xl font-medium tracking-tight text-balance">
          Start with a <span className="text-fd-primary">ModSettings.xml</span>
        </h2>
        <p className="mt-4 max-w-2xl text-fd-muted-foreground text-balance">
          One file beside your <code>ModInfo.xml</code> gives your mod a settings page. Add C# later,
          or never.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/docs/getting-started" className={primaryButton}>
            Get Started
          </Link>
          <Link href="/docs/setting-types" className={secondaryButton}>
            Choose a Setting Type
          </Link>
          <a href={nexusUrl} rel="noreferrer noopener" target="_blank" className={secondaryButton}>
            Nexus Mods
          </a>
          <a href={githubUrl} rel="noreferrer noopener" target="_blank" className={secondaryButton}>
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

function Brand({ children }: { children: ReactNode }) {
  return <span className="font-medium text-fd-primary">{children}</span>;
}

function SectionHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="col-span-full mt-4 -mb-4 max-w-2xl">
      <h2 className="text-3xl font-medium tracking-tight text-balance">{title}</h2>
      <p className="mt-4 text-fd-muted-foreground">{lead}</p>
    </div>
  );
}

function FeatureCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-fd-border bg-fd-card p-6 text-sm text-fd-muted-foreground shadow-lg">
      <h3 className="mb-6 text-xl font-medium tracking-tight text-fd-card-foreground lg:text-2xl">
        {title}
      </h3>
      {children}
    </div>
  );
}

// Every CardImage crops to the same shape, so two cards side by side end up the same height. A tall
// shot keeps its top edge; a wide one is trimmed evenly from both sides.
const cardImageClass = 'block aspect-16/10 h-auto w-full object-cover object-top';
const wideCardImageClass = cardImageClass.replace('object-top', 'object-center');

// A screenshot filling the foot of a FeatureCard. The negative margins cancel the card's padding, so
// it runs to the card's side and bottom edges, and the card's rounded corners clip it.
function CardImage({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-6 -mb-6 mt-auto pt-6">
      <div className="border-t border-fd-border">{children}</div>
    </div>
  );
}

// A colored card that frames an image, the counterpart to a FeatureCard beside it. `dark` stays
// dark in both themes, for images that need a dark backdrop.
function BrandPanel({ tone = 'brand', children }: { tone?: 'brand' | 'dark'; children: ReactNode }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl p-6 shadow-lg md:p-8 ${
        tone === 'brand' ? 'bg-fd-primary' : 'bg-neutral-950'
      }`}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.18)_1.5px,transparent_1.5px)] bg-size-[10px_10px]"
      />
      <div className="relative flex w-full justify-center">{children}</div>
    </div>
  );
}
