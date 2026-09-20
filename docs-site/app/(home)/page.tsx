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

const modCs = `public class MyModGears : IGearsModApi
{
    public void InitMod(IGearsMod modInstance) { }

    public void OnGlobalSettingsLoaded(IModGlobalSettings modSettings)
    {
        modSettings.BindSettingsClass(typeof(Global));
    }

    public void OnWorldSettingsLoaded(IModWorldSettings worldSettings) { }

    private static class Global
    {
        // Gears finds the setting and assigns it to the field.
        [Setting("General.Display.ShowHints")]
        public static ISwitchGlobalSetting<bool> ShowHints;

        // And calls this whenever the player applies a change.
        [SettingOnValueChanged("General.Display.ShowHints")]
        private static void ShowHintsChanged(IValueModSetting<bool> setting, bool newValue)
        {
            MyHud.HintsVisible = newValue;
        }
    }
}`;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <WhyGears />
      <SettingTypes />
      <XmlOrCsharp />
      <GlobalAndWorld />
      <GetStarted />
    </main>
  );
}

function Hero() {
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-tight text-balance md:text-6xl">
          Give your mod a settings page
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-fd-muted-foreground text-balance">
          Gears draws your mod&apos;s settings in the game&apos;s own Mods menu, saves what the player
          picks, sends per-world values to every client, and hands those values back to your XML
          patches and your C#.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/getting-started"
            className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
          <Link
            href="/docs"
            className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Documentation
          </Link>
          <a
            href={nexusUrl}
            rel="noreferrer noopener"
            target="_blank"
            className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Nexus Mods
          </a>
          <a
            href={githubUrl}
            rel="noreferrer noopener"
            target="_blank"
            className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            GitHub
          </a>
        </div>

        <p className="mt-6 text-sm text-fd-muted-foreground">
          Gears 8.0.0 · GearsAPI.dll 3.0.0
        </p>

        <div className="mt-14 w-full">
          <MediaSlot
            title="/images/Home-Hero.png"
            alt="A mod's settings page in the Mods menu, with a player stepping a Selector and dragging a Slider"
          >
            The Mods window open on a mod&apos;s settings page: the tab row, a category heading, and
            four or five rows of different types, with the description pane filled on the right. Step
            one Selector and drag one Slider so the rows respond and the Apply button lights up. 3–5
            seconds, looping, at least 1280 wide, whole window in frame. A still of the same view
            works if a GIF is awkward.
          </MediaSlot>
        </div>
      </div>
    </section>
  );
}

function WhyGears() {
  return (
    <Section muted>
      <SectionHeading
        title="Why not a config file"
        lead="Every mod needs somewhere to keep its options. Here is what Gears does that a file in your mod folder does not."
      />

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-fd-border bg-fd-card p-6">
          <h3 className="font-semibold">Players never edit a file</h3>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            A config file means alt-tabbing, finding the mod folder, editing XML by hand, and no
            feedback at all when a typo breaks it. Gears draws the settings in the Mods menu, saves
            what the player picks, and restores it the next time the game starts.
          </p>
          <div className="mt-5">
            <MediaSlot
              title="/images/Mods-Menu.png"
              alt="The Mods window listing installed mods, with one selected"
              ratio="aspect-4/3"
            >
              The Mods window with several mods listed down the left and one selected, so a reader
              sees where a player finds any of this. Crop to the window.
            </MediaSlot>
          </div>
        </article>

        <article className="rounded-xl border border-fd-border bg-fd-card p-6">
          <h3 className="font-semibold">You would be writing UI, not gameplay</h3>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            Building this yourself means a control for each setting type, a saved-values file and the
            code that restores it, localization lookups, per-world serialization, the server-to-client
            handoff, and a rebinding row that behaves like the game&apos;s own Controls screen. That is
            what Gears already is.
          </p>
        </article>

        <article className="rounded-xl border border-fd-border bg-fd-card p-6">
          <h3 className="font-semibold">One host picks, every client gets it</h3>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            A config file belongs to one install. The host chooses a world&apos;s settings on the New
            Game screen, Gears writes them into the save, and every client that joins receives the
            same values.
          </p>
        </article>
      </div>
    </Section>
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
    <Section>
      <SectionHeading
        title="Five setting types"
        lead="Tabs and categories group them, and each one is a row the player reads and changes without leaving the game."
      />

      <div className="mt-10 overflow-hidden rounded-xl border border-fd-border">
        <Image src={settingTabs} alt="A row of setting tabs across the top of a mod's settings page" />
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {settingTypes.map((type) => (
          <div key={type.name}>
            <h3 className="font-semibold">{type.name}</h3>
            <p className="mt-1 max-w-3xl text-sm text-fd-muted-foreground">{type.description}</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-fd-border">
              <Image src={type.image} alt={`A ${type.name} setting as it appears in the game`} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-fd-muted-foreground">
        Every type also takes a caption, a description, preview images shown as the value changes,
        localization keys for its labels, and a warning when a change needs a world reload or a game
        restart. See{' '}
        <Link href="/docs/setting-types" className="font-medium underline underline-offset-4">
          Choose a Setting Type
        </Link>
        .
      </p>
    </Section>
  );
}

function XmlOrCsharp() {
  return (
    <Section muted>
      <SectionHeading
        title="Write XML, or XML plus C#"
        lead="Declaring settings takes no code at all. Reach for C# when you want typed values and callbacks."
      />

      <div className="mt-10">
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

      <div className="mt-8 rounded-xl border border-fd-border bg-fd-card p-6">
        <h3 className="font-semibold">Gears stays optional</h3>
        <p className="mt-3 max-w-3xl text-sm text-fd-muted-foreground">
          Ship <code>GearsAPI.dll</code> in your own mod folder and your mod still loads for a player
          who does not have Gears installed. They see no settings page, and the patches that read a
          setting do not apply. See{' '}
          <Link
            href="/docs/csharp/getting-started"
            className="font-medium underline underline-offset-4"
          >
            Get Started with C#
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}

function GlobalAndWorld() {
  return (
    <Section>
      <SectionHeading
        title="Two kinds of setting"
        lead="Where a value is stored, and who gets to change it, is the one decision to make per setting."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-fd-border bg-fd-card p-6">
          <h3 className="font-semibold">Global settings</h3>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            A <strong>global setting</strong> belongs to the player. They change it from the main menu
            or the in-game menu, the value applies in every world, and Gears saves it to one file
            shared by every mod.
          </p>
        </article>

        <article className="rounded-xl border border-fd-border bg-fd-card p-6">
          <h3 className="font-semibold">World settings</h3>
          <p className="mt-3 text-sm text-fd-muted-foreground">
            A <strong>world setting</strong> belongs to one world. The host picks it when creating or
            continuing that world, every client that joins receives it, and it cannot be changed while
            the world is running.
          </p>
        </article>
      </div>

      <div className="mt-8">
        <MediaSlot
          title="/images/World-Settings.png"
          alt="A mod's world settings category on the New Game screen"
          ratio="aspect-16/9"
        >
          The New Game screen&apos;s world settings page showing one mod&apos;s world category and two
          or three rows, making it obvious these are picked at world creation rather than in the Mods
          menu.
        </MediaSlot>
      </div>
    </Section>
  );
}

function GetStarted() {
  return (
    <Section muted>
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold tracking-tight text-balance">
          Start with a ModSettings.xml
        </h2>
        <p className="mt-4 max-w-2xl text-fd-muted-foreground text-balance">
          One file beside your <code>ModInfo.xml</code> gives your mod a settings page. Add C# later,
          or never.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/getting-started"
            className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
          <Link
            href="/docs/setting-types"
            className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Choose a Setting Type
          </Link>
          <a
            href={nexusUrl}
            rel="noreferrer noopener"
            target="_blank"
            className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            Nexus Mods
          </a>
          <a
            href={githubUrl}
            rel="noreferrer noopener"
            target="_blank"
            className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            GitHub
          </a>
        </div>
      </div>
    </Section>
  );
}

function Section({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <section className={`border-t border-fd-border ${muted ? 'bg-fd-card/40' : ''}`}>
      <div className="mx-auto w-full max-w-5xl px-4 py-16 md:py-24">{children}</div>
    </section>
  );
}

function SectionHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-bold tracking-tight text-balance">{title}</h2>
      <p className="mt-4 text-fd-muted-foreground">{lead}</p>
    </div>
  );
}
