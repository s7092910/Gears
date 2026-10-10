#!/usr/bin/env node
/**
 * Generates content/docs/reference/** from the C# sources of every assembly in ASSEMBLIES
 * (lib/model.mjs): GearsAPI and GearsSharing.
 *
 *   node scripts/gen-api-reference.mjs           write the pages
 *   node scripts/gen-api-reference.mjs --check   fail if the pages are stale (for CI)
 *   node scripts/gen-api-reference.mjs --report  only print the undocumented-member report
 *
 * Everything — signatures, kinds, inheritance, Implements/Derived, enum values, and every scrap
 * of prose — comes from `///` XML doc comments in the sources. There is no separate prose
 * store: a member with no doc comment renders as "_No description yet._" and is called out by
 * the report below.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildModel, orderTypes, ASSEMBLIES } from './lib/model.mjs';
import { typeLabel } from './lib/csharp.mjs';

const HERE = import.meta.dirname;
const SITE = path.resolve(HERE, '..');
const REPO = path.resolve(SITE, '..');
const OUT = path.join(SITE, 'content', 'docs', 'reference');

const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check');
const REPORT_ONLY = args.has('--report');

/**
 * Members that exist but are deliberately not documented: implicit parameterless constructors
 * that mods have no reason to call directly, and the internal singleton behind the static
 * `GearsSettingsManager` methods.
 */
const HIDDEN = {
  GearsApi: ['GearsApi()'],
  SettingsSerializationProvider: ['SettingsSerializationProvider()'],
  GearsSettingsManager: ['instance'],
};

const model = buildModel(REPO, { hidden: HIDDEN });

// ---------------------------------------------------------------- helpers

const url = (t) => `/docs/reference/${t.section}/${t.slug}`;

/** Link a type name if we know it; otherwise render it as plain code (game/.NET types). */
function link(name, label) {
  const t = model.resolve(name);
  const text = label ?? name;
  return t ? `[\`${text}\`](${url(t)})` : `\`${text}\``;
}

const linkAll = (names) => names.map((n) => link(n)).join(' · ');

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Resolve a `cref` value (curly braces stand in for `<>` on a generic type) to a doc link, or
 * plain code if it names something outside GearsAPI. Falls back to the declaring type for a
 * member-qualified cref such as `IModSetting.OnEnabled`. */
function docLink(cref, label) {
  const name = cref.replace(/\{/g, '<').replace(/\}/g, '>');
  const text = label ?? name;
  let t = model.resolve(name);
  if (!t) {
    const dot = name.lastIndexOf('.');
    if (dot > 0) t = model.resolve(name.slice(0, dot));
  }
  return t ? `[\`${text}\`](${url(t)})` : `\`${text}\``;
}

/** Escape what MDX would read as JSX or an expression, outside inline code spans. */
function escapeMdx(s) {
  return s
    .split(/(`[^`]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')))
    .join('');
}

/** `<list>` as markdown items, or as one line joined with `; `. */
function renderList(type, body, block) {
  const items = [...body.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const term = m[1].match(/<term>([\s\S]*?)<\/term>/)?.[1]?.trim();
    const desc = (m[1].match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? m[1].replace(/<term>[\s\S]*?<\/term>/, '')).trim();
    return term ? `**${term}**: ${desc}` : desc;
  });
  if (!block) return ` ${items.join('; ')} `;
  return '\n\n' + items.map((item, i) => `${type === 'number' ? `${i + 1}.` : '-'} ${item}`).join('\n') + '\n\n';
}

/**
 * Render a fragment of parsed XML doc text (see `parseDoc` in lib/csharp.mjs) as the same
 * markdown hand-written prose uses: `<see cref>` becomes a link (or plain code for a type outside
 * the reference), `<paramref>`/`<typeparamref>`, `<c>` and `<see langword>` become code spans,
 * `<b>`/`<i>` become bold and italics, and the `&lt;&gt;` escaping XML requires around literal
 * angle brackets is undone.
 *
 * `block` turns `<para>` into paragraphs and `<list>` into markdown lists, for a page body; without
 * it, they flatten to one line, for table cells. `mdx: false` skips MDX escaping, for frontmatter.
 */
function renderXmlText(raw, { block = false, mdx = true } = {}) {
  if (raw == null) return null;
  let s = String(raw);
  s = s.replace(/<list(?:\s+type="([^"]*)")?\s*>([\s\S]*?)<\/list>/g, (_, type, body) => renderList(type, body.replace(/<listheader>[\s\S]*?<\/listheader>/g, ''), block));
  s = s.replace(/<\/?para>/g, block ? '\n\n' : ' ');
  s = s.replace(/<see\s+cref="([^"]+)"\s*\/>/g, (_, cref) => docLink(cref));
  s = s.replace(/<see\s+cref="([^"]+)"\s*>([\s\S]*?)<\/see>/g, (_, cref, label) => docLink(cref, decodeEntities(label.trim())));
  s = s.replace(/<see\s+langword="([^"]+)"\s*\/>/g, (_, word) => `\`${word}\``);
  s = s.replace(/<paramref\s+name="([^"]+)"\s*\/>/g, (_, n) => `\`${n}\``);
  s = s.replace(/<typeparamref\s+name="([^"]+)"\s*\/>/g, (_, n) => `\`${n}\``);
  s = s.replace(/<c>([\s\S]*?)<\/c>/g, (_, code) => `\`${decodeEntities(code)}\``);
  s = s.replace(/<b>([\s\S]*?)<\/b>/g, (_, text) => `**${text.trim()}**`);
  s = s.replace(/<i>([\s\S]*?)<\/i>/g, (_, text) => `_${text.trim()}_`);
  s = decodeEntities(s);
  if (mdx) s = escapeMdx(s);
  return s
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function yamlString(s) {
  const plain = String(s ?? '').replace(/\*\*/g, '').replace(/`/g, '');
  return `"${plain.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Markdown -> a JSX fragment, for TypeTable cells (which take a ReactNode, not markdown). */
function toJsx(src) {
  let s = String(src);
  s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/\[`([^`]+)`\]\(([^)]+)\)/g, '<a href="$2"><code>$1</code></a>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
  return `<>${s}</>`;
}

/** Heading text is parsed as MDX, so generic brackets must be escaped. */
const heading = (s) => String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');

const GROUP_ORDER = [
  ['constructor', 'Constructors'],
  ['field', 'Fields'],
  ['property', 'Properties'],
  ['event', 'Events'],
  ['method', 'Methods'],
  ['operator', 'Operators'],
];

// ---------------------------------------------------------------- <inheritdoc/>

/**
 * The summaries .NET itself gives the members most often overridden, for an `<inheritdoc/>` whose
 * source is outside the reference.
 */
const DOTNET_SUMMARIES = {
  'Equals(Object)': 'Determines whether the specified object is equal to the current object.',
  'GetHashCode()': 'Serves as the default hash function.',
  'ToString()': 'Returns a string that represents the current object.',
};
// IEquatable<T>.Equals(T), for an Equals that takes anything but Object.
const EQUATABLE_SUMMARY = 'Indicates whether the current object is equal to another object of the same type.';

/**
 * The doc comment a member actually has: its own, or for `<inheritdoc/>`, the nearest one with a
 * summary up the base classes and implemented interfaces, then the .NET summaries above. Its own
 * tags win over inherited ones.
 */
function effectiveDoc(t, m, seen = new Set()) {
  const own = m.xmlDoc;
  if (!own?.inheritdoc || own.summary) return own;
  const guard = `${t.key}#${m.key}`;
  if (seen.has(guard)) return own;
  seen.add(guard);

  for (const baseName of [t.baseClass, ...t.implementsList].filter(Boolean)) {
    const base = model.resolve(baseName);
    const bm = base?.members.find((x) => x.key === m.key);
    const doc = bm && effectiveDoc(base, bm, seen);
    if (doc?.summary) return mergeDoc(own, doc);
  }
  const fallback = DOTNET_SUMMARIES[m.key] ?? (m.name === 'Equals' && m.params.length === 1 ? EQUATABLE_SUMMARY : null);
  return fallback ? mergeDoc(own, { summary: fallback }) : own;
}

function mergeDoc(own, inherited) {
  const merged = { ...inherited };
  for (const [k, v] of Object.entries(own)) if (v != null && v !== false) merged[k] = v;
  return merged;
}

for (const t of model.types.values()) {
  for (const m of t.members) m.resolvedDoc = effectiveDoc(t, m);
}

// ---------------------------------------------------------------- rendering

function renderType(t) {
  const xd = t.xmlDoc ?? {};
  const out = [];

  const summary = renderXmlText(xd.summary, { mdx: false }) ?? '';
  const description = renderXmlText(xd.remarks, { block: true }) ?? renderXmlText(xd.summary, { block: true }) ?? '_No description yet._';
  const typeParamsText = xd.typeParams
    ? Object.entries(xd.typeParams).map(([n, d]) => `\`${n}\` — ${renderXmlText(d)}`).join('; ')
    : null;
  const note = renderXmlText(xd.note);

  out.push('---');
  out.push(`title: ${yamlString(t.display)}`);
  out.push(`description: ${yamlString(summary)}`);
  out.push('---');
  out.push('');
  out.push(`<TypeMeta kind="${t.kindLabel}" namespace="${t.namespace}" assembly="${t.assembly}" source="${t.source}" />`);
  out.push('');
  out.push('```csharp');
  out.push(t.decl);
  out.push('```');
  out.push('');
  out.push(description.trim());
  out.push('');

  const facts = [];
  if (t.typeParams.length && typeParamsText) facts.push(`**Type parameters:** ${typeParamsText}`);
  if (t.inheritance) {
    // The chain ends at this type; render that last hop as plain code rather than a self-link,
    // and by its short name (a nested type is `SelectedButton` here, not the qualified form).
    const chain = t.inheritance.map((n, i) =>
      i === t.inheritance.length - 1 ? `\`${t.name}\`` : link(n)
    );
    facts.push(`**Inheritance:** ${chain.join(' → ')}`);
  }
  if (t.implementsList.length) facts.push(`**Implements:** ${linkAll(t.implementsList)}`);
  if (t.derivedList.length) facts.push(`**Derived:** ${linkAll(t.derivedList)}`);
  if (t.nested.length) facts.push(`**Nested types:** ${linkAll(t.nested)}`);
  if (t.attributes.length) {
    const names = t.attributes.map((a) => a.replace(/^\[/, '').replace(/\]$/, '').split('(')[0].trim());
    facts.push(`**Attributes:** ${[...new Set(names.map((n) => `\`${n}Attribute\``))].join(' · ')}`);
  }
  if (facts.length) { out.push(facts.join('\\\n')); out.push(''); }

  if (xd.reserved) {
    out.push('<Callout type="warn" title="Reserved">');
    out.push('  Gears scans only its own assembly for this attribute, so it has no effect in a mod');
    out.push('  assembly.');
    out.push('</Callout>');
    out.push('');
  }
  if (note) {
    out.push('<Callout>');
    out.push(`  ${note}`);
    out.push('</Callout>');
    out.push('');
  }

  if (t.kind === 'enum') {
    out.push('## Fields');
    out.push('');
    out.push('| Name | Value | Description |');
    out.push('|---|---|---|');
    for (const m of t.members) {
      const desc = renderXmlText(m.resolvedDoc?.summary) ?? '';
      out.push(`| \`${m.name}\` | ${m.value} | ${desc} |`);
    }
    out.push('');
  } else {
    for (const [kind, title] of GROUP_ORDER) {
      const members = t.members.filter((m) => m.kind === kind);
      if (!members.length) continue;
      out.push(`## ${title}`);
      out.push('');
      for (const m of members) {
        out.push(`### ${heading(m.key)}`);
        out.push('');
        out.push('```csharp');
        out.push(m.signature);
        out.push('```');
        out.push('');
        out.push(...renderMemberDoc(m));
      }
    }
  }

  if (t.kind === 'delegate' && t.params?.length) {
    out.push('## Parameters');
    out.push('');
    out.push('<TypeTable');
    out.push('  type={{');
    for (const a of t.params) {
      const desc = renderXmlText(xd.params?.[a.name]) ?? '';
      out.push(`    ${a.name}: {`);
      out.push(`      type: ${toJsx(link(a.type, typeLabel(a.type)))},`);
      out.push(`      description: ${toJsx(desc)},`);
      out.push('    },');
    }
    out.push('  }}');
    out.push('/>');
    out.push('');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** A member's prose: summary, remarks, then its parameters, return value and exceptions. */
function renderMemberDoc(m) {
  const d = m.resolvedDoc ?? {};
  const out = [renderXmlText(d.summary, { block: true }) ?? '_No description yet._', ''];
  const remarks = renderXmlText(d.remarks, { block: true });
  if (remarks) out.push(remarks, '');

  const params = m.params.filter((p) => d.params?.[p.name]);
  if (params.length) {
    out.push('**Parameters:**', '');
    for (const p of params) out.push(`- \`${p.name}\`: ${renderXmlText(d.params[p.name])}`);
    out.push('');
  }
  if (d.returns) out.push(`**Returns:** ${renderXmlText(d.returns)}`, '');
  if (d.exceptions?.length) {
    out.push('**Exceptions:**', '');
    for (const e of d.exceptions) out.push(`- ${docLink(e.cref)}: ${renderXmlText(e.text)}`);
    out.push('');
  }
  return out;
}

function renderIndex(bySection) {
  const [api, sharing] = ASSEMBLIES;
  const out = [];
  out.push('---');
  out.push('title: API Reference');
  out.push(`description: Every public type in ${api.name} ${api.version} and ${sharing.name} ${sharing.version}, one page per type, grouped by namespace.`);
  out.push('---');
  out.push('');
  out.push('Every public type in the two Gears assemblies you can reference, one page per type, laid out');
  out.push('much like the .NET API browser: a declaration, then its constructors, fields, properties,');
  out.push('events, methods and operators, each with its real signature.');
  out.push('');
  out.push(`- [\`${api.name}\` ${api.version}](#${anchor(`${api.name} ${api.version}`)}) is the assembly mods reference to create and read their settings.`);
  out.push(`- [\`${sharing.name}\` ${sharing.version}](#${anchor(`${sharing.name} ${sharing.version}`)}) reads and writes share codes, for websites and tools. See [Share Codes](/docs/share-codes).`);
  out.push('');
  out.push('Members inherited from a base type are not repeated. Every type named on an *Implements*,');
  out.push('*Derived* or *Inheritance* line links to its own page, so follow those to find them. Game and');
  out.push('.NET types (`Mod`, `IModApi`, `PlayerAction`, `Color`, `Attribute`) are not linked.');
  out.push('');
  out.push('<Callout title="Generated from source">');
  out.push(`  These pages are generated from the C# in ${ASSEMBLIES.map((a) => `\`${a.root}\``).join(' and ')} by`);
  out.push('  `docs-site/scripts/gen-api-reference.mjs`. Signatures always match the assemblies.');
  out.push('</Callout>');
  out.push('');
  for (const assembly of ASSEMBLIES) {
    out.push(`## ${assembly.name} ${assembly.version}`);
    out.push('');
    for (const sec of model.sections.filter((s) => s.assembly === assembly.name)) {
      const rows = bySection.get(sec.id) ?? [];
      if (!rows.length) continue;
      out.push(`### ${sec.title}`);
      out.push('');
      out.push(sec.blurb);
      out.push('');
      out.push('| Type | Kind | Summary |');
      out.push('|---|---|---|');
      for (const t of rows) {
        const summary = renderXmlText(t.xmlDoc?.summary) ?? '';
        out.push(`| [\`${t.display}\`](${url(t)}) | ${t.kindLabel} | ${summary} |`);
      }
      out.push('');
    }
  }
  return out.join('\n');
}

/** The heading anchor Fumadocs gives a heading: lowercase, punctuation dropped, spaces to dashes. */
function anchor(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}

// ---------------------------------------------------------------- undocumented-member report

const report = { undocumented: [], warnings: model.warnings };

for (const t of model.types.values()) {
  if (!t.xmlDoc?.summary) report.undocumented.push(`${t.key} (type)`);
  for (const m of t.members) {
    if (!m.resolvedDoc?.summary) report.undocumented.push(`${t.key}#${m.key}`);
  }
  if (t.kind === 'delegate') {
    for (const a of t.params ?? []) {
      if (!t.xmlDoc?.params?.[a.name]) report.undocumented.push(`${t.key}#param:${a.name}`);
    }
  }
}

function printReport() {
  const n = report.undocumented.length + report.warnings.length;
  console.log(`\n--- drift report ---`);
  console.log(`types: ${model.types.size}, documented members: ${[...model.types.values()].reduce((a, t) => a + t.members.length, 0)}`);
  const section = (title, list) => {
    if (!list.length) return;
    console.log(`\n${title} (${list.length}):`);
    for (const x of list) console.log(`  ${x}`);
  };
  section('undocumented (no /// summary)', report.undocumented);
  section('parser warnings', report.warnings);
  if (n === 0) console.log('\nno drift - everything has a /// summary');
  return n;
}

// ---------------------------------------------------------------- write

const bySection = new Map();
for (const t of model.types.values()) {
  if (!bySection.has(t.section)) bySection.set(t.section, []);
  bySection.get(t.section).push(t);
}
// reading order per section, curated in SECTIONS
for (const sec of model.sections) {
  if (bySection.has(sec.id)) bySection.set(sec.id, orderTypes(sec, bySection.get(sec.id)));
}
// A type in the assembly that nobody has placed in a reading order yet is worth surfacing.
for (const sec of model.sections) {
  for (const t of bySection.get(sec.id) ?? []) {
    if (!(sec.order ?? []).includes(t.key)) {
      model.warnings.push(`${t.key} is not in the ${sec.id} reading order (appended at the end)`);
    }
  }
}

if (REPORT_ONLY) {
  printReport();
  process.exit(0);
}

const files = new Map();
for (const t of model.types.values()) {
  files.set(path.join(OUT, t.section, `${t.slug}.mdx`), renderType(t));
}
for (const sec of model.sections) {
  const rows = bySection.get(sec.id) ?? [];
  if (!rows.length) continue;
  // The sidebar shows the short label; the full namespace stays on the index page and in each
  // type page's TypeMeta strip.
  files.set(
    path.join(OUT, sec.id, 'meta.json'),
    JSON.stringify({ title: sec.short ?? sec.title, description: sec.blurb, pages: rows.map((t) => t.slug) }, null, 2) + '\n'
  );
}
  // `index` is deliberately absent from `pages`. Fumadocs only treats a folder's index.mdx as
  // the folder's own link -- SidebarFolderLink, which navigates *and* expands on click -- when it
  // is not listed in `pages`; listing it makes it a separate child and leaves the folder a plain
  // toggle. See the `delete node.index` branch in fumadocs-core's page tree builder.
files.set(
  path.join(OUT, 'meta.json'),
  JSON.stringify(
    { title: 'API Reference', description: 'Every public type in GearsAPI and GearsSharing', pages: model.sections.map((s) => s.id) },
    null, 2
  ) + '\n'
);
files.set(path.join(OUT, 'index.mdx'), renderIndex(bySection));

if (CHECK) {
  const stale = [];
  for (const [file, content] of files) {
    const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (existing !== content) stale.push(path.relative(SITE, file));
  }
  // files present on disk that the generator would not produce
  const onDisk = fs.existsSync(OUT)
    ? fs.readdirSync(OUT, { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => path.join(e.parentPath ?? e.path, e.name))
    : [];
  const orphans = onDisk.filter((f) => !files.has(f)).map((f) => path.relative(SITE, f));

  const n = printReport();
  if (stale.length || orphans.length) {
    console.log(`\n${stale.length} stale file(s), ${orphans.length} orphan(s):`);
    for (const f of [...stale, ...orphans]) console.log(`  ${f}`);
    console.log('\nRun `npm run gen:api` and commit the result.');
    process.exit(1);
  }
  console.log('\nreference is up to date');
  process.exit(n > 0 ? 0 : 0);
}

let written = 0;
for (const [file, content] of files) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (existing !== content) { fs.writeFileSync(file, content, 'utf8'); written++; }
}
console.log(`generated ${files.size} file(s), ${written} changed`);
printReport();
