// The share code generator page's logic, kept out of the React component so the checks can run it:
// turning edited World settings into a code, matching an opened code back onto loaded mods, and
// checking what the user typed.

import { bitsToFloat, floatToBits, modHash, settingHash, valuesEqual, type ShareCode, type SharedMod, type SharedValue } from './format.ts';
import { parseValue, type WorldSchema, type WorldSettingSchema } from './mod-settings.ts';

/** A mod the user loaded: its name from ModInfo.xml and its World settings from ModSettings.xml. */
export interface LoadedMod {
  name: string;
  schema: WorldSchema;
}

/** Values that differ from a setting's default (or might), by mod name and then setting name. */
export type EditedValues = Record<string, Record<string, SharedValue>>;

/**
 * Builds the World share code: every loaded setting whose value differs from its default, plus
 * `kept` - entries of an opened code that matched nothing loaded, carried over by hash so
 * re-sharing a code does not lose them.
 */
export function buildWorldCode(loaded: LoadedMod[], values: EditedValues, kept: SharedMod[]): ShareCode {
  const keptByHash = new Map(kept.map((mod) => [mod.nameHash as number, mod]));
  const mods: SharedMod[] = [];

  for (const mod of loaded) {
    const edited = values[mod.name] ?? {};
    const settings: SharedMod['settings'] = mod.schema.settings
      .filter((setting) => edited[setting.name] && !valuesEqual(edited[setting.name], setting.defaultValue))
      .map((setting) => ({ name: setting.name, value: edited[setting.name] }));

    const hash = modHash(mod.name);
    const extra = keptByHash.get(hash);
    if (extra) {
      keptByHash.delete(hash);
      const named = new Set(settings.map((setting) => settingHash(null, null, setting.name as string)));
      settings.push(...extra.settings.filter((setting) => !named.has(setting.hash as number)));
    }
    mods.push({ name: mod.name, settings });
  }

  mods.push(...keptByHash.values());
  return { scope: 'World', mods };
}

export interface MatchResult {
  /** The values that matched a loaded setting of a fitting type. */
  values: EditedValues;
  /** Everything else, by hash: mods not loaded, settings not in their XML, or values of the wrong type. */
  unmatched: SharedMod[];
  matched: number;
}

/** Matches decoded (hash-only) mods onto the loaded mods by name hash. */
export function matchCode(mods: SharedMod[], loaded: LoadedMod[]): MatchResult {
  const loadedByHash = new Map(loaded.map((mod) => [modHash(mod.name), mod]));
  const values: EditedValues = {};
  const unmatched: SharedMod[] = [];
  let matched = 0;

  for (const mod of mods) {
    const target = loadedByHash.get(mod.nameHash as number);
    const bySettingHash = new Map(target?.schema.settings.map((setting) => [settingHash(null, null, setting.name), setting]));
    const left: SharedMod['settings'] = [];

    for (const setting of mod.settings) {
      const schema = bySettingHash.get(setting.hash as number);
      if (target && schema && fits(schema, setting.value)) {
        (values[target.name] ??= {})[schema.name] = setting.value;
        matched++;
      } else {
        left.push(setting);
      }
    }
    if (left.length > 0) {
      unmatched.push({ nameHash: mod.nameHash, settings: left });
    }
  }
  return { values, unmatched, matched };
}

/** Whether a code's value is one the setting can hold, as the game's import would accept it. */
function fits(setting: WorldSettingSchema, value: SharedValue): boolean {
  const kinds: Record<WorldSettingSchema['valueType'], SharedValue['kind']> = {
    bool: 'Bool',
    int: 'Int',
    float: 'Float',
    string: 'String',
    enum: 'EnumName',
  };
  return value.kind === kinds[setting.valueType] && (value.kind !== 'String' || value.value !== null);
}

/** The text an editor shows for a value. */
export function valueText(value: SharedValue): string {
  switch (value.kind) {
    case 'Bool':
      return value.value ? 'true' : 'false';
    case 'Int':
      return String(value.value);
    case 'Float':
      return floatText(value.bits);
    case 'String':
    case 'EnumName':
    case 'Serialized':
      return value.value ?? '';
    case 'EnumValue':
      return value.value.toString();
    case 'Color':
      return value.bits.map(floatText).join(',');
  }
}

/** The shortest decimal that reads back as the same single-precision float: 0.1, not 0.100000001. */
function floatText(bits: number): string {
  const value = bitsToFloat(bits);
  for (let digits = 1; digits <= 9; digits++) {
    const text = String(Number(value.toPrecision(digits)));
    if (floatToBits(Number(text)) === bits) {
      return text;
    }
  }
  return String(value);
}

/** Checks what the user typed for a setting: its value, or why it cannot be used. */
export function checkInput(setting: WorldSettingSchema, text: string): { value: SharedValue } | { error: string } {
  const value = parseValue(setting.valueType, text);
  if (value === null) {
    return { error: setting.valueType === 'enum' ? 'Enter the enum member name, exactly as the mod spells it.' : `Enter a valid ${setting.valueType}.` };
  }
  if ((value.kind === 'Int' || value.kind === 'Float') && setting.min !== undefined && setting.max !== undefined) {
    // A float setting's range is single precision in game, so compare it that way.
    const [number, min, max] = value.kind === 'Int'
      ? [value.value, setting.min, setting.max]
      : [bitsToFloat(value.bits), Math.fround(setting.min), Math.fround(setting.max)];
    if (number < min || number > max) {
      return { error: `Must be between ${setting.min} and ${setting.max}.` };
    }
  }
  return { value };
}
