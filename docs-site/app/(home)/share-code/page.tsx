import type { Metadata } from 'next';
import { ShareCodeGenerator } from '@/components/share-code-generator';

export const metadata: Metadata = {
  title: 'Share Code Generator',
  description: 'Make a World settings share code for 7 Days to Die mods that use Gears, from the mods’ own files.',
};

export default function ShareCodePage() {
  return (
    <main className="mx-auto w-full max-w-350 px-4 py-12">
      <div className="rounded-xl border border-dashed border-fd-muted-foreground/60 p-6">
        <div className="max-w-2xl">
          <h1 className="mb-4 text-xl font-medium">Share Code Generator</h1>
          <p className="text-fd-muted-foreground">
            Make a share code for a world without starting the game. A share code is a line of text that starts with{' '}
            <code>Gears:</code> and holds the World settings you changed from their defaults, for one or more mods.
            World settings are the settings a mod sets for each world; they can&apos;t change while the world runs.
          </p>
          <p className="mt-3 text-fd-muted-foreground">
            Choose a mod folder, change its settings, and copy the code. Your files stay in your browser; nothing is
            uploaded.
          </p>
          <ul className="mt-3 list-disc ps-5 text-sm text-fd-muted-foreground">
            <li>
              The page finds settings in each mod&apos;s ModSettings.xml. Settings a mod creates in its code don&apos;t
              appear here.
            </li>
            <li>
              Some settings take a value from a list the mod doesn&apos;t include in ModSettings.xml. Type those values
              exactly as the mod spells them.
            </li>
          </ul>
        </div>
      </div>

      <ShareCodeGenerator />
    </main>
  );
}
