#!/usr/bin/env node
/**
 * Generates content/docs/reference/** from the GearsAPI C# sources.
 *
 *   node scripts/gen-api-reference.mjs           write the pages
 *   node scripts/gen-api-reference.mjs --check   fail if the pages are stale (for CI)
 *   node scripts/gen-api-reference.mjs --report  only print the undocumented-member report
 *
 * Everything — signatures, kinds, inheritance, Implements/Derived, enum values, and every scrap
 * of prose — comes from `///` XML doc comments in GearsAPI/Source. There is no separate prose
 * store: a member with no doc comment renders as "_No description yet._" and is called out by
 * the report below.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildModel, orderTypes, ASSEMBLY } from './lib/model.mjs';
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

/**
 * Render a fragment of parsed XML doc text (see `parseDoc` in lib/csharp.mjs) as the same
 * markdown hand-written prose uses: `<see cref>` becomes a link (or plain code for a type outside
 * GearsAPI), `<paramref>`/`<typeparamref>` and `<c>` become code spans, and the `&lt;&gt;`
 * escaping XML requires around literal angle brackets is undone.
 */
function renderXmlText(raw) {
  if (raw == null) return null;
  let s = String(raw);
  s = s.replace(/<see\s+cref="([^"]+)"\s*\/>/g, (_, cref) => docLink(cref));
  s = s.replace(/<see\s+cref="([^"]+)"\s*>([\s\S]*?)<\/see>/g, (_, cref, label) => docLink(cref, decodeEntities(label.trim())));
  s = s.replace(/<paramref\s+name="([^"]+)"\s*\/>/g, (_, n) => `\`${n}\``);
  s = s.replace(/<typeparamref\s+name="([^"]+)"\s*\/>/g, (_, n) => `\`${n}\``);
  s = s.replace(/<c>([\s\S]*?)<\/c>/g, (_, code) => `\`${decodeEntities(code)}\``);
  return decodeEntities(s);
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
  ['property', 'Properties'],
  ['event', 'Events'],
  ['method', 'Methods'],
  ['field', 'Fields'],
];

// ---------------------------------------------------------------- rendering

function renderType(t) {
  const xd = t.xmlDoc ?? {};
  const out = [];

  const summary = renderXmlText(xd.summary) ?? '';
  const description = renderXmlText(xd.remarks) ?? renderXmlText(xd.summary) ?? '_No description yet._';
  const typeParamsText = xd.typeParams
    ? Object.entries(xd.typeParams).map(([n, d]) => `\`${n}\` — ${renderXmlText(d)}`).join('; ')
    : null;
  const note = renderXmlText(xd.note);

  out.push('---');
  out.push(`title: ${yamlString(t.display)}`);
  out.push(`description: ${yamlString(summary)}`);
  out.push('---');
  out.push('');
  out.push(`<TypeMeta kind="${t.kindLabel}" namespace="${t.namespace}" source="${t.source}" />`);
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
      const desc = renderXmlText(m.xmlDoc?.summary) ?? '';
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
        out.push(renderXmlText(m.xmlDoc?.summary) ?? '_No description yet._');
        out.push('');
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

function renderIndex(bySection) {
  const out = [];
  out.push('---');
  out.push('title: API Reference');
  out.push('description: Every public type in GearsAPI.dll 3.0.0, one page per type, grouped by namespace.');
  out.push('---');
  out.push('');
  out.push(`Every public type in \`${ASSEMBLY}\` 3.0.0 — one page per type, laid out the way the .NET API`);
  out.push('browser does it: a declaration, then its constructors, properties, methods and events, each with');
  out.push('its real signature.');
  out.push('');
  out.push('Members inherited from a base interface are not repeated. Every GearsAPI type named on an');
  out.push('*Implements*, *Derived* or *Inheritance* line links to its own page, so follow those to find');
  out.push('them. Game and .NET types (`Mod`, `IModApi`, `PlayerAction`, `Color`, `Attribute`) are not linked.');
  out.push('');
  out.push('<Callout title="Generated from source">');
  out.push('  These pages are generated from the C# in `GearsAPI/Source` by');
  out.push('  `docs-site/scripts/gen-api-reference.mjs`. Signatures always match the assembly.');
  out.push('</Callout>');
  out.push('');
  for (const sec of model.sections) {
    const rows = bySection.get(sec.id) ?? [];
    if (!rows.length) continue;
    out.push(`## ${sec.title}`);
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
  return out.join('\n');
}

// ---------------------------------------------------------------- undocumented-member report

const report = { undocumented: [], warnings: model.warnings };

for (const t of model.types.values()) {
  if (!t.xmlDoc?.summary) report.undocumented.push(`${t.key} (type)`);
  for (const m of t.members) {
    if (!m.xmlDoc?.summary) report.undocumented.push(`${t.key}#${m.key}`);
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
    { title: 'API Reference', description: 'Every public type in GearsAPI 3.0.0', pages: model.sections.map((s) => s.id) },
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
