'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Check, ClipboardCopy, FolderOpen, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MAX_CODE_LENGTH, encode, modHash, validate, valuesEqual, type SharedMod } from '@/lib/share-code/format';
import { readModName, readWorldSchema, type WorldSettingSchema } from '@/lib/share-code/mod-settings';
import { buildWorldCode, checkInput, matchCode, valueText, type EditedValues, type LoadedMod } from '@/lib/share-code/generator';

/** What the user typed, by mod name and then setting name. A setting with no entry shows its default. */
type Inputs = Record<string, Record<string, string>>;

type Message = { ok: boolean; text: string };

const inputClass =
  'h-9 w-full rounded-md border border-fd-border bg-fd-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none aria-invalid:border-red-500';

/**
 * The World settings share code generator. Everything happens in the browser: the mod files the
 * user picks are read here and never uploaded.
 */
export function ShareCodeGenerator() {
  const [mods, setMods] = useState<LoadedMod[]>([]);
  const [inputs, setInputs] = useState<Inputs>({});
  const [kept, setKept] = useState<SharedMod[]>([]);
  const [loadNotes, setLoadNotes] = useState<string[]>([]);
  const [opening, setOpening] = useState('');
  const [openMessage, setOpenMessage] = useState<Message | null>(null);
  const [output, setOutput] = useState<{ code?: string; error?: string }>({});
  const [copied, setCopied] = useState(false);

  // Every setting's value as typed, checked; the code is only made once all of them are valid.
  const values: EditedValues = {};
  let invalid = 0;
  for (const mod of mods) {
    for (const setting of mod.schema.settings) {
      const text = inputs[mod.name]?.[setting.name];
      if (text === undefined) continue;
      const result = checkInput(setting, text);
      if ('error' in result) invalid++;
      else (values[mod.name] ??= {})[setting.name] = result.value;
    }
  }

  const blocked = invalid > 0 ? `Fix the ${invalid === 1 ? 'setting' : `${invalid} settings`} marked in red to make a code.` : null;
  const valuesKey = JSON.stringify([mods.map((mod) => mod.name), values, kept.length], (_, v) => (typeof v === 'bigint' ? v.toString() : v));
  useEffect(() => {
    if (invalid > 0) return;
    let current = true;
    encode(buildWorldCode(mods, values, kept))
      .then((code) => current && setOutput({ code }))
      .catch((e: Error) => current && setOutput({ error: e.message }));
    return () => {
      current = false;
    };
    // valuesKey stands for mods, values and kept, which are rebuilt on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey, invalid]);

  async function loadFolder(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    const folders = new Map<string, { modInfo?: File; modSettings?: File }>();
    for (const file of files) {
      const path = file.webkitRelativePath || file.name;
      const slash = path.lastIndexOf('/');
      const name = path.slice(slash + 1).toLowerCase();
      if (name !== 'modinfo.xml' && name !== 'modsettings.xml') continue;
      const folder = folders.get(path.slice(0, slash)) ?? {};
      folder[name === 'modinfo.xml' ? 'modInfo' : 'modSettings'] = file;
      folders.set(path.slice(0, slash), folder);
    }

    const notes: string[] = [];
    const found: LoadedMod[] = [];
    for (const [folder, { modInfo, modSettings }] of folders) {
      if (!modInfo || !modSettings) continue;
      const info = parseXml(await modInfo.text());
      const settings = parseXml(await modSettings.text());
      if (!info || !settings) {
        notes.push(`${folder}: ${!info ? 'ModInfo.xml' : 'ModSettings.xml'} isn't valid XML.`);
        continue;
      }
      const name = readModName(info);
      if (!name) {
        notes.push(`${folder}: ModInfo.xml has no <Name value="...">.`);
        continue;
      }
      const schema = readWorldSchema(settings);
      if (schema.settings.length === 0) {
        notes.push(`${name} has no World settings in its ModSettings.xml.${schema.warnings.length ? ` ${schema.warnings[0]}` : ''}`);
        continue;
      }
      found.push({ name, schema });
    }
    if (found.length === 0 && notes.length === 0) {
      notes.push('No folder there has both a ModInfo.xml and a ModSettings.xml. Pick a mod folder, or your Mods folder.');
    }

    // A mod loaded again replaces the earlier copy. Entries kept from an opened code that now
    // match a loaded mod become editable values.
    const names = new Set(found.map((mod) => mod.name));
    const next = [...mods.filter((mod) => !names.has(mod.name)), ...found];
    const match = matchCode(kept, next);
    setMods(next);
    setInputs((old) => mergeInputs(old, match.values));
    setKept(match.unmatched);
    setLoadNotes(notes);
  }

  async function openCode() {
    const result = await validate(opening);
    if (!result.isValid || !result.shareCode) {
      setOpenMessage({ ok: false, text: result.errors[0]?.message ?? 'This code could not be read.' });
      return;
    }
    if (result.shareCode.scope !== 'World') {
      setOpenMessage({ ok: false, text: 'This is a Global settings code. This page makes World settings codes only.' });
      return;
    }
    // Like importing in game, a code replaces every value: whatever it does not mention is a default.
    const match = matchCode(result.shareCode.mods, mods);
    setInputs(mergeInputs({}, match.values));
    setKept(match.unmatched);
    const left = match.unmatched.reduce((count, mod) => count + mod.settings.length, 0);
    setOpenMessage({
      ok: true,
      text:
        `Opened. ${match.matched} ${match.matched === 1 ? 'setting' : 'settings'} matched the loaded mods.` +
        (left > 0 ? ` ${left} didn't, and ${left === 1 ? 'is' : 'are'} kept in the code as ${left === 1 ? 'it is' : 'they are'}.` : ''),
    });
  }

  function setInput(mod: string, setting: string, text: string | undefined) {
    setInputs((old) => {
      const forMod = { ...old[mod] };
      if (text === undefined) delete forMod[setting];
      else forMod[setting] = text;
      return { ...old, [mod]: forMod };
    });
  }

  async function copy() {
    if (!output.code) return;
    await navigator.clipboard.writeText(output.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const changed = mods.reduce(
    (count, mod) => count + mod.schema.settings.filter((s) => values[mod.name]?.[s.name] && !valuesEqual(values[mod.name][s.name], s.defaultValue)).length,
    0,
  );
  const modNames = new Map(mods.map((mod) => [modHash(mod.name), mod.name]));

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-fd-border bg-fd-card p-4">
          <h2 className="mb-1 font-medium">1. Load your mods</h2>
          <p className="mb-3 text-sm text-fd-muted-foreground">
            Pick a mod folder, or your whole Mods folder to load every mod in it. The page reads only each mod&apos;s
            ModInfo.xml and ModSettings.xml.
          </p>
          <label className={cn(buttonVariants({ color: 'primary', size: 'sm' }), 'cursor-pointer gap-2')}>
            <FolderOpen className="size-4" aria-hidden />
            Choose folder
            <input
              type="file"
              multiple
              className="sr-only"
              ref={(element) => element?.setAttribute('webkitdirectory', '')}
              onChange={loadFolder}
            />
          </label>
          {loadNotes.length > 0 && (
            <ul className="mt-3 list-disc ps-5 text-sm text-fd-muted-foreground">
              {loadNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>

        {mods.map((mod) => (
          <ModCard
            key={mod.name}
            mod={mod}
            inputs={inputs[mod.name] ?? {}}
            onInput={(setting, text) => setInput(mod.name, setting, text)}
            onResetAll={() => setInputs((old) => ({ ...old, [mod.name]: {} }))}
            onRemove={() => setMods((old) => old.filter((m) => m.name !== mod.name))}
          />
        ))}
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <section className="rounded-xl border border-fd-border bg-fd-card p-4">
          <h2 className="mb-1 font-medium">2. Your share code</h2>
          <p className="mb-3 text-sm text-fd-muted-foreground">
            {changed === 0 && kept.length === 0
              ? 'Nothing is changed yet. This code resets every World setting to its default.'
              : `Holds every setting that differs from its default: ${changed} from the loaded mods${kept.length > 0 ? ', plus the entries kept from the code you opened' : ''}.`}
          </p>
          {!blocked && output.code !== undefined ? (
            <>
              <textarea
                readOnly
                value={output.code}
                rows={4}
                aria-label="Share code"
                onFocus={(event) => event.target.select()}
                className="w-full resize-y rounded-md border border-fd-border bg-fd-background p-2 font-mono text-xs break-all"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-fd-muted-foreground">
                  {output.code.length.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()} characters
                </span>
                <button type="button" onClick={copy} className={cn(buttonVariants({ color: 'primary', size: 'sm' }), 'gap-2')}>
                  {copied ? <Check className="size-4" aria-hidden /> : <ClipboardCopy className="size-4" aria-hidden />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {blocked ?? output.error}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-fd-border bg-fd-card p-4">
          <h2 className="mb-1 font-medium">Open a code</h2>
          <p className="mb-3 text-sm text-fd-muted-foreground">
            Paste a World settings code to change it. Load the mods it&apos;s for first, so their settings can be shown.
          </p>
          <textarea
            value={opening}
            onChange={(event) => setOpening(event.target.value)}
            rows={3}
            placeholder="Gears:..."
            aria-label="Code to open"
            className="w-full resize-y rounded-md border border-fd-border bg-fd-background p-2 font-mono text-xs break-all"
          />
          <button
            type="button"
            onClick={openCode}
            disabled={opening.trim() === ''}
            className={cn(buttonVariants({ color: 'secondary', size: 'sm' }), 'mt-2')}
          >
            Open
          </button>
          {openMessage && (
            <p className={cn('mt-2 text-sm', openMessage.ok ? 'text-fd-muted-foreground' : 'text-red-600 dark:text-red-400')} role="status">
              {openMessage.text}
            </p>
          )}
          {kept.length > 0 && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-fd-muted-foreground">Kept entries</summary>
              <p className="mt-1 text-xs text-fd-muted-foreground">
                A code holds only a hash of each name. These are for mods that aren&apos;t loaded, or settings that
                aren&apos;t in a mod&apos;s ModSettings.xml.
              </p>
              <ul className="mt-1 font-mono text-xs">
                {kept.flatMap((mod) =>
                  mod.settings.map((setting) => (
                    <li key={`${mod.nameHash}/${setting.hash}`}>
                      {modNames.get(mod.nameHash as number) ?? hashLabel(mod.nameHash)}/{hashLabel(setting.hash)} = {valueText(setting.value)}
                    </li>
                  )),
                )}
              </ul>
            </details>
          )}
        </section>
      </aside>
    </div>
  );
}

function ModCard({
  mod,
  inputs,
  onInput,
  onResetAll,
  onRemove,
}: {
  mod: LoadedMod;
  inputs: Record<string, string>;
  onInput: (setting: string, text: string | undefined) => void;
  onResetAll: () => void;
  onRemove: () => void;
}) {
  // Categories in the order they first appear; Gears merges categories that share a name.
  const categories = new Map<string, WorldSettingSchema[]>();
  for (const setting of mod.schema.settings) {
    categories.set(setting.category, [...(categories.get(setting.category) ?? []), setting]);
  }

  return (
    <section className="rounded-xl border border-fd-border bg-fd-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">{mod.name}</h2>
        <div className="flex gap-2">
          <button type="button" onClick={onResetAll} className={cn(buttonVariants({ color: 'ghost', size: 'sm' }), 'gap-1.5')}>
            <RotateCcw className="size-3.5" aria-hidden />
            Reset all
          </button>
          <button type="button" onClick={onRemove} className={cn(buttonVariants({ color: 'ghost', size: 'sm' }), 'gap-1.5')}>
            <Trash2 className="size-3.5" aria-hidden />
            Remove
          </button>
        </div>
      </div>
      {mod.schema.warnings.length > 0 && (
        <details className="mb-3 text-sm">
          <summary className="cursor-pointer text-fd-muted-foreground">
            {mod.schema.warnings.length} {mod.schema.warnings.length === 1 ? 'setting was' : 'settings were'} left out, as
            Gears leaves {mod.schema.warnings.length === 1 ? 'it' : 'them'} out
          </summary>
          <ul className="mt-1 list-disc ps-5 text-fd-muted-foreground">
            {mod.schema.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
      {[...categories].map(([category, settings]) => (
        <div key={category} className="mt-3 first:mt-0">
          <h3 className="mb-2 font-mono text-xs text-fd-muted-foreground">{category}</h3>
          <div className="flex flex-col gap-2">
            {settings.map((setting) => (
              <SettingRow
                key={setting.name}
                id={`setting-${mod.name}-${setting.name}`}
                setting={setting}
                text={inputs[setting.name]}
                onInput={(text) => onInput(setting.name, text)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function SettingRow({
  id,
  setting,
  text,
  onInput,
}: {
  id: string;
  setting: WorldSettingSchema;
  text: string | undefined;
  onInput: (text: string | undefined) => void;
}) {
  const defaultText = valueText(setting.defaultValue);
  const shown = text ?? defaultText;
  const result = checkInput(setting, shown);
  const error = 'error' in result ? result.error : null;
  const changed = !error && 'value' in result && !valuesEqual(result.value, setting.defaultValue);

  let control;
  if (setting.valueType === 'bool') {
    control = (
      <input
        id={id}
        type="checkbox"
        checked={shown === 'true'}
        onChange={(event) => onInput(String(event.target.checked))}
        className="size-4 accent-fd-primary"
      />
    );
  } else if (setting.options) {
    // A value from an opened code that the list does not have still shows, so nothing is hidden.
    const options = setting.options.includes(shown) ? setting.options : [...setting.options, shown];
    control = (
      <select id={id} value={shown} onChange={(event) => onInput(event.target.value)} className={inputClass} aria-invalid={!!error}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  } else if (setting.valueType === 'int' || setting.valueType === 'float') {
    control = (
      <input
        id={id}
        type="number"
        value={shown}
        min={setting.min}
        max={setting.max}
        step={setting.increment ?? (setting.valueType === 'int' ? 1 : 'any')}
        onChange={(event) => onInput(event.target.value)}
        className={inputClass}
        aria-invalid={!!error}
      />
    );
  } else {
    control = (
      <input
        id={id}
        type="text"
        value={shown}
        onChange={(event) => onInput(event.target.value)}
        className={inputClass}
        aria-invalid={!!error}
      />
    );
  }

  const range = setting.min !== undefined ? ` · ${setting.min} to ${setting.max}` : '';
  return (
    <div
      className={cn(
        'grid items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2 sm:grid-cols-[minmax(0,1fr)_14rem]',
        changed ? 'border-fd-primary/60 bg-fd-primary/5' : 'border-transparent',
      )}
    >
      <div className="min-w-0">
        <label htmlFor={id} className="block truncate text-sm font-medium">
          {setting.name}
        </label>
        <p className="text-xs text-fd-muted-foreground">
          {setting.element} · {setting.enumType ?? setting.valueType}
          {range} · default {defaultText}
          {changed && (
            <>
              {' · '}
              <button type="button" onClick={() => onInput(undefined)} className="text-fd-primary hover:underline">
                Reset
              </button>
            </>
          )}
        </p>
      </div>
      <div>
        {control}
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}

/** Parses XML text in the browser; `null` if it is not well-formed. */
function parseXml(text: string): Document | null {
  const document = new DOMParser().parseFromString(text, 'application/xml');
  return document.getElementsByTagName('parsererror').length > 0 ? null : document;
}

/** Adds opened or matched values to the inputs, as the text each editor shows. */
function mergeInputs(inputs: Inputs, values: EditedValues): Inputs {
  const merged: Inputs = { ...inputs };
  for (const [mod, settings] of Object.entries(values)) {
    merged[mod] = { ...merged[mod] };
    for (const [setting, value] of Object.entries(settings)) {
      merged[mod][setting] = valueText(value);
    }
  }
  return merged;
}

function hashLabel(hash: number | undefined): string {
  return '#' + ((hash ?? 0) >>> 0).toString(16).padStart(8, '0');
}
