/**
 * Turns parsed C# into the model the reference pages are rendered from.
 *
 * Everything structural is derived here — kind labels, slugs, transitive Implements, reverse
 * Derived, inheritance chains, nested types, enum values. Only prose comes from elsewhere.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseFile, memberKey, splitGeneric } from './csharp.mjs';

/**
 * Namespace -> section folder under /docs/reference.
 *
 * `order` is the reading order for the sidebar and the index tables: general contracts before
 * the concrete setting types. Any type not listed is appended in source order, so adding a type
 * to the assembly never breaks generation — it just lands at the end of its section until
 * someone places it here.
 */
export const SECTIONS = [
  {
    id: 'core', ns: 'GearsAPI', title: 'GearsAPI',
    blurb: 'The assembly entry point.',
    order: ['GearsApi'],
  },
  {
    id: 'settings', ns: 'GearsAPI.Settings', title: 'GearsAPI.Settings',
    blurb: 'The mod-level contracts and the members every setting shares.',
    order: [
      'GearsSettingsManager', 'IGearsMod', 'IGearsModApi', 'IModSetting',
      'OnSettingEnabledEvent', 'IValueModSetting<T>', 'ValueSelectedEvent<T>',
      'SettingRestartScope',
    ],
  },
  {
    id: 'base', ns: 'GearsAPI.Settings.Base', title: 'GearsAPI.Settings.Base',
    blurb: 'Non-generic faces of the value settings, for type-agnostic code.',
    order: [
      'IValueModSettingBase', 'ISelectorSettingBase', 'ISliderSettingBase',
      'ISwitchSettingBase', 'ISwitchSettingBase.SelectedButton',
    ],
  },
  {
    id: 'global', ns: 'GearsAPI.Settings.Global', title: 'GearsAPI.Settings.Global',
    blurb: "The player's settings: tabs, categories and the global setting types.",
    order: [
      'IModGlobalSettings', 'IGlobalModSettingsTab', 'IGlobalModSettingsCategory',
      'IGlobalModSetting', 'OnSettingChangedEvent', 'IGlobalValueSetting<T>',
      'ValueChangedEvent<T>', 'ISelectorGlobalSetting<T>', 'ISliderGlobalSetting<T>',
      'ISwitchGlobalSetting<T>', 'IColorSelectorGlobalSetting', 'IControlBindingSetting',
    ],
  },
  {
    id: 'world', ns: 'GearsAPI.Settings.World', title: 'GearsAPI.Settings.World',
    blurb: "A save's settings: categories and the world setting types.",
    order: [
      'IModWorldSettings', 'IWorldModSettingsCategory', 'IWorldModSetting',
      'ISelectorWorldSetting<T>', 'ISliderWorldSetting<T>', 'ISwitchWorldSetting<T>',
    ],
  },
  {
    id: 'attributes', ns: 'GearsAPI.Attributes', title: 'GearsAPI.Attributes',
    blurb: 'Binding, listener and serialization attributes.',
    order: [
      'SettingPathAttribute', 'SettingAttribute', 'SettingListenerAttribute',
      'SettingOnValueChangedAttribute', 'SettingOnSelectedAttribute',
      'SettingOnChangedAttribute', 'SettingOnEnabledAttribute',
      'SettingsSerializationProvider', 'SettingParserAttribute', 'SettingFormatterAttribute',
      'SettingFactoryAttribute', 'SettingFactoryEnumAttribute', 'SettingFactoryFixedAttribute',
    ],
  },
];

/** Sort a section's types by its curated `order`, unlisted ones last in source order. */
export function orderTypes(section, types) {
  const order = section.order ?? [];
  const rank = (t) => {
    const i = order.indexOf(t.key);
    return i === -1 ? order.length : i;
  };
  return [...types].sort((a, b) => rank(a) - rank(b) || a.source.localeCompare(b.source) || a.plain.localeCompare(b.plain));
}

export const ASSEMBLY = 'GearsAPI.dll';

/** PascalCase -> kebab-case, the way the Nebula-style URLs are built. */
export function slugify(name) {
  return name
    .replace(/\./g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function kindLabel(t) {
  if (t.kind === 'interface') return 'Interface';
  if (t.kind === 'enum') return 'Enum';
  if (t.kind === 'delegate') return 'Delegate';
  if (t.kind === 'struct') return 'Struct';
  if (t.modifiers.includes('static')) return 'Static class';
  if (t.modifiers.includes('abstract')) return 'Abstract class';
  if (t.modifiers.includes('sealed')) return 'Sealed class';
  return 'Class';
}

/** Unknown bases: `IFoo` is taken to be an interface, anything else a class. */
const looksLikeInterface = (n) => /^I[A-Z]/.test(splitGeneric(n).base);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.cs') ? [p] : [];
  });
}

/**
 * @param {string} repoRoot absolute path to the repository root
 * @param {object} [opts]
 * @param {Record<string,string[]>} [opts.hidden] type -> member keys to leave undocumented
 */
export function buildModel(repoRoot, opts = {}) {
  const srcRoot = path.join(repoRoot, 'GearsAPI', 'Source');
  const hidden = opts.hidden ?? {};

  /** @type {Map<string, any>} display name -> type */
  const types = new Map();
  const warnings = [];

  for (const file of walk(srcRoot).sort()) {
    const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
    for (const ns of parseFile(fs.readFileSync(file, 'utf8'), rel)) {
      const section = SECTIONS.find((s) => s.ns === ns.name);
      if (!section) { warnings.push(`namespace not mapped to a section: ${ns.name}`); continue; }
      for (const t of ns.types) {
        const display = t.declaringType ? `${t.declaringType}.${t.name}` : t.name;
        const generic = t.typeParams.length ? `<${t.typeParams.join(', ')}>` : '';
        const key = display + generic;

        const node = {
          key,                       // e.g. `IValueModSetting<T>`
          name: t.name,
          display: display + generic,
          plain: display,            // without generic args, for slugs
          kind: t.kind,
          kindLabel: kindLabel(t),
          namespace: ns.name,
          section: section.id,
          slug: slugify(display),
          source: rel,
          typeParams: t.typeParams,
          bases: t.bases,
          constraints: t.constraints,
          attributes: t.attributes ?? [],
          xmlDoc: t.doc ?? null,
          declaringType: t.declaringType,
          nested: (t.nested ?? []).map((n) => `${t.name}.${n.name}`),
          decl: declarationOf(t),
          members: [],
          params: t.params ?? null,  // delegates only
        };

        const hides = new Set(hidden[key] ?? []);
        for (const m of t.members) {
          if (!isDocumented(m, t)) continue;
          const mk = memberKey(m);
          if (hides.has(mk)) continue;
          node.members.push({
            key: mk,
            name: m.name,
            kind: m.kind,
            signature: m.signature,
            value: m.value,
            params: m.params ?? [],
            xmlDoc: m.doc ?? null,
          });
        }

        // A non-abstract class with no declared constructor still has a public one.
        if (t.kind === 'class' && !t.modifiers.includes('static') && !t.modifiers.includes('abstract')
          && !node.members.some((m) => m.kind === 'constructor')) {
          const mk = `${t.name}()`;
          if (!hides.has(mk)) {
            node.members.unshift({
              key: mk, name: t.name, kind: 'constructor',
              signature: `public ${t.name}()`, params: [], xmlDoc: null, implicit: true,
            });
          }
        }

        if (types.has(key)) warnings.push(`duplicate type key: ${key}`);
        types.set(key, node);
      }
    }
  }

  // ---- derived relationships ----
  const byPlain = new Map([...types.values()].map((t) => [t.plain, t]));
  const resolve = (baseName) => byPlain.get(splitGeneric(baseName).base) ?? null;

  for (const t of types.values()) {
    // direct interface bases vs base class
    t.baseInterfaces = [];
    t.baseClass = null;
    for (const b of t.bases) {
      const known = resolve(b);
      const isInterface = known ? known.kind === 'interface' : looksLikeInterface(b);
      if (isInterface) t.baseInterfaces.push(b);
      else t.baseClass = b;
    }
  }

  // transitive Implements, breadth-first from the direct bases
  for (const t of types.values()) {
    const seen = [];
    const queue = [...t.baseInterfaces];
    while (queue.length) {
      const b = queue.shift();
      const known = resolve(b);
      const label = known ? known.display : b;
      if (seen.includes(label)) continue;
      seen.push(label);
      if (known) queue.push(...known.baseInterfaces);
    }
    t.implementsList = seen;
  }

  // reverse index: direct derivations only
  for (const t of types.values()) t.derivedList = [];
  for (const t of types.values()) {
    for (const b of [...t.baseInterfaces, ...(t.baseClass ? [t.baseClass] : [])]) {
      const known = resolve(b);
      if (known && !known.derivedList.includes(t.display)) known.derivedList.push(t.display);
    }
  }

  // inheritance chain for classes, enums and structs
  for (const t of types.values()) {
    if (t.kind === 'interface' || t.kind === 'delegate') { t.inheritance = null; continue; }
    if (t.kind === 'enum') { t.inheritance = ['Object', 'ValueType', 'Enum', t.display]; continue; }
    const chain = [t.display];
    let cur = t;
    const guard = new Set([t.key]);
    while (cur && cur.baseClass) {
      const known = resolve(cur.baseClass);
      chain.unshift(known ? known.display : cur.baseClass);
      if (!known || guard.has(known.key)) { cur = null; break; }
      guard.add(known.key);
      cur = known;
    }
    if (chain[0] !== 'Object') chain.unshift('Object');
    t.inheritance = chain;
  }

  return { types, sections: SECTIONS, warnings, resolve: (n) => byPlain.get(splitGeneric(n).base) ?? null };
}

/** Members worth documenting: public API surface plus protected members subclassers need. */
function isDocumented(m, type) {
  const mods = m.modifiers ?? [];
  if (mods.includes('internal')) return false;   // includes `protected internal`
  if (mods.includes('private')) return false;
  if (type.kind === 'interface' || type.kind === 'enum') return true;
  if (mods.includes('public') || mods.includes('protected')) return true;
  return false;                                   // no modifier on a class member == private
}

/** Reconstruct the declaration as it should appear in the page's code fence. */
function declarationOf(t) {
  if (t.kind === 'delegate') return t.signature;
  const lines = [...(t.attributes ?? [])];
  const generic = t.typeParams.length ? `<${t.typeParams.join(', ')}>` : '';
  let head = [...t.modifiers, t.kind, `${t.name}${generic}`].join(' ');
  if (t.bases.length) head += ` : ${t.bases.join(', ')}`;
  if (t.constraints) head += ` ${t.constraints}`;
  lines.push(head);
  return lines.join('\n');
}
