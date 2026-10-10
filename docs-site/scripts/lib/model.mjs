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
 * The assemblies the reference covers, each with its source folder (relative to the repo root)
 * and its sections: namespace -> section folder under /docs/reference.
 *
 * `version` is typed here rather than read from the project, so the pages carry a plain number;
 * scripts/check-versions.mjs checks it against the project's own version.
 *
 * `order` is the reading order for the sidebar and the index tables: general contracts before
 * the concrete types. Any type not listed is appended in source order, so adding a type to an
 * assembly never breaks generation — it just lands at the end of its section until someone
 * places it here.
 */
export const ASSEMBLIES = [
  { name: 'GearsAPI.dll', version: '3.0.0', root: 'GearsAPI/Source', sections: [
  {
    id: 'core', ns: 'GearsAPI', title: 'GearsAPI', short: 'Core',
    blurb: 'The assembly entry point.',
    order: ['GearsApi'],
  },
  {
    id: 'settings', ns: 'GearsAPI.Settings', title: 'GearsAPI.Settings', short: 'Settings',
    blurb: 'The mod-level contracts and the members every setting shares.',
    order: [
      'GearsSettingsManager', 'IGearsMod', 'IGearsModApi', 'IModSetting',
      'OnSettingEnabledEvent', 'IValueModSetting<T>', 'OnSelectedChangedEvent<T>',
      'SettingRestartScope',
    ],
  },
  {
    id: 'base', ns: 'GearsAPI.Settings.Base', title: 'GearsAPI.Settings.Base', short: 'Settings.Base',
    blurb: 'Non-generic faces of the value settings, for type-agnostic code.',
    order: [
      'IValueModSettingBase', 'ISelectorSettingBase', 'ISliderSettingBase',
      'ISwitchSettingBase', 'ISwitchSettingBase.SelectedButton',
    ],
  },
  {
    id: 'global', ns: 'GearsAPI.Settings.Global', title: 'GearsAPI.Settings.Global', short: 'Settings.Global',
    blurb: "The player's settings: tabs, categories and the global setting types.",
    order: [
      'IModGlobalSettings', 'IGlobalModSettingsTab', 'IGlobalModSettingsCategory',
      'IGlobalModSetting', 'OnSettingAppliedEvent', 'IGlobalValueSetting<T>',
      'ValueChangedEvent<T>', 'ISelectorGlobalSetting<T>', 'ISliderGlobalSetting<T>',
      'ISwitchGlobalSetting<T>', 'IColorSelectorGlobalSetting', 'IControlBindingSetting',
    ],
  },
  {
    id: 'world', ns: 'GearsAPI.Settings.World', title: 'GearsAPI.Settings.World', short: 'Settings.World',
    blurb: "A save's settings: categories and the world setting types.",
    order: [
      'IModWorldSettings', 'IWorldModSettingsCategory', 'IWorldModSetting',
      'ISelectorWorldSetting<T>', 'ISliderWorldSetting<T>', 'ISwitchWorldSetting<T>',
    ],
  },
  {
    id: 'attributes', ns: 'GearsAPI.Attributes', title: 'GearsAPI.Attributes', short: 'Attributes',
    blurb: 'Binding, listener and serialization attributes.',
    order: [
      'SettingPathAttribute', 'SettingAttribute', 'SettingPlayerActionAttribute', 'SettingListenerAttribute',
      'SettingOnValueChangedAttribute', 'SettingOnSelectedChangedAttribute',
      'SettingOnAppliedAttribute', 'SettingOnEnabledAttribute',
      'SettingsSerializationProvider', 'SettingParserAttribute', 'SettingFormatterAttribute',
      'SettingFactoryAttribute', 'SettingFactoryEnumAttribute', 'SettingFactoryFixedAttribute',
    ],
  },
  ] },
  { name: 'GearsSharing.dll', version: '1.0.0', root: 'GearsSharing', sections: [
  {
    id: 'gearssharing', ns: 'GearsSharing', title: 'GearsSharing', short: 'GearsSharing',
    blurb: 'Read, write and check share codes.',
    order: [
      'ShareCodeFormat', 'ShareCode', 'ShareCodeScope', 'SharedMod', 'SharedSetting',
      'SharedValue', 'SharedBool', 'SharedInt', 'SharedFloat', 'SharedString', 'SharedEnumName',
      'SharedEnumValue', 'SharedColor', 'SharedSerialized',
      'ShareCodeValidationResult', 'ShareCodeError', 'ShareCodeErrorType',
    ],
  },
  ] },
];

/** Every section, in assembly order, each tagged with its assembly. */
export const SECTIONS = ASSEMBLIES.flatMap((a) => a.sections.map((s) => ({ ...s, assembly: a.name, version: a.version })));

/** Sort a section's types by its curated `order`, unlisted ones last in source order. */
export function orderTypes(section, types) {
  const order = section.order ?? [];
  const rank = (t) => {
    const i = order.indexOf(t.key);
    return i === -1 ? order.length : i;
  };
  return [...types].sort((a, b) => rank(a) - rank(b) || a.source.localeCompare(b.source) || a.plain.localeCompare(b.plain));
}

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

// Build output: a local build leaves generated .cs files here that a CI checkout doesn't have.
const SKIP_DIRS = new Set(['bin', 'obj']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(p);
    return p.endsWith('.cs') ? [p] : [];
  });
}

/**
 * Only public types are part of an assembly's API. A type nested in an interface is public by
 * default; one nested in a type that isn't public is hidden with it.
 */
function isPublicType(t, hiddenNames, kindsByName) {
  if (t.declaringType && hiddenNames.has(t.declaringType)) return false;
  if (t.modifiers.includes('public')) return true;
  return t.declaringType != null && kindsByName.get(t.declaringType) === 'interface' && !t.modifiers.some((m) => ['private', 'protected', 'internal'].includes(m));
}

/**
 * @param {string} repoRoot absolute path to the repository root
 * @param {object} [opts]
 * @param {Record<string,string[]>} [opts.hidden] type -> member keys to leave undocumented
 */
export function buildModel(repoRoot, opts = {}) {
  const hidden = opts.hidden ?? {};

  /** @type {Map<string, any>} display name -> type */
  const types = new Map();
  const warnings = [];

  const files = ASSEMBLIES.flatMap((a) => walk(path.join(repoRoot, ...a.root.split('/'))).sort().map((file) => ({ file, assembly: a })));
  for (const { file, assembly } of files) {
    const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
    for (const ns of parseFile(fs.readFileSync(file, 'utf8'), rel)) {
      const section = assembly.sections.find((s) => s.ns === ns.name);
      if (!section) { warnings.push(`namespace not mapped to a section: ${ns.name}`); continue; }
      const hiddenNames = new Set();
      const kindsByName = new Map(ns.types.map((t) => [t.name, t.kind]));
      for (const t of ns.types) {
        if (!isPublicType(t, hiddenNames, kindsByName)) { hiddenNames.add(t.name); continue; }
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
          assembly: assembly.name,
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
            override: (m.modifiers ?? []).includes('override'),
          });
        }

        // A non-abstract class with no declared constructor still has a public one. A class whose
        // constructors are all non-public has none, so look before filtering by visibility.
        if (t.kind === 'class' && !t.modifiers.includes('static') && !t.modifiers.includes('abstract')
          && !t.members.some((m) => m.kind === 'constructor')) {
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
