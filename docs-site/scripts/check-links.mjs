// Verifies every internal link in the docs resolves to a real page (and heading, if anchored),
// and that no wiki-style bare link survived the port.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', 'content', 'docs');
const PUBLIC = path.resolve(import.meta.dirname, '..', 'public');

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.mdx') ? [p] : [];
  });
}

const files = walk(ROOT);

/** content/docs/xml/localization.mdx -> /docs/xml/localization ; index.mdx -> parent url */
function urlOf(file) {
  let rel = path.relative(ROOT, file).replace(/\\/g, '/').replace(/\.mdx$/, '');
  if (rel === 'index') return '/docs';
  if (rel.endsWith('/index')) rel = rel.slice(0, -'/index'.length);
  return '/docs/' + rel;
}

// GitHub-style slugger, matching what Fumadocs' rehype-slug produces.
function slug(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 \-_]/g, '')
    .replace(/ +/g, '-');
}

const pages = new Map(); // url -> Set(anchors)
// Only fenced code is removed. Inline code must survive: headings like `### \`defaultValue\``
// slug from their rendered text, so stripping the span would lose the anchor.
const strip = (s) =>
  s
    .replace(/^---\n[\s\S]*?\n---\n/, '')       // frontmatter
    .replace(/```[\s\S]*?```/g, '');            // fenced code

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const body = strip(raw);
  const anchors = new Set();
  for (const m of body.matchAll(/^#{2,6} +(.+)$/gm)) {
    let h = m[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\*\*/g, '')
      .replace(/`/g, '');
    anchors.add(slug(h));
  }
  pages.set(urlOf(f), anchors);
}

let problems = 0;
const report = (msg) => { problems++; console.log('  ' + msg); };

console.log(`pages: ${pages.size}`);
console.log('\n--- internal link targets ---');
const seenTargets = new Set();
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const here = urlOf(f);
  // Both markdown links and JSX href props (Cards on the index pages).
  const targets = [
    ...[...raw.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]),
    ...[...raw.matchAll(/href="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const target of targets) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    if (/^\/images\//.test(target)) {
      if (!fs.existsSync(path.join(PUBLIC, target.replace(/^\//, '')))) {
        report(`MISSING IMAGE ${target}  (in ${path.relative(ROOT, f)})`);
      }
      continue;
    }
    if (!target.startsWith('/docs')) {
      report(`NON-ABSOLUTE LINK "${target}"  (in ${path.relative(ROOT, f)})`);
      continue;
    }
    seenTargets.add(target);
    const [p, anchor] = target.split('#');
    if (!pages.has(p)) {
      report(`DANGLING PAGE ${target}  (in ${path.relative(ROOT, f)})`);
    } else if (anchor && !pages.get(p).has(anchor)) {
      report(`DANGLING ANCHOR ${target}  (in ${path.relative(ROOT, f)})`);
    }
  }
  // in-page anchors
  for (const m of raw.matchAll(/\]\((#[^)\s]+)\)/g)) {
    const a = m[1].slice(1);
    if (!pages.get(here).has(a)) {
      report(`DANGLING SELF-ANCHOR #${a}  (in ${path.relative(ROOT, f)})`);
    }
  }
}

console.log('\n--- leftover wiki conventions ---');
const WIKI_NAMES = [
  'Home', 'Getting-Started', 'Setting-Types', 'ModSettings-XML-Reference', 'Localization',
  'Using-Mod-Settings-in-XML-Patches', 'CSharp-Getting-Started', 'CSharp-Global-Settings',
  'CSharp-World-Settings', 'CSharp-Setting-Listeners', 'CSharp-Custom-Value-Types',
  'CSharp-API-Reference', 'Troubleshooting', 'Upgrading-to-GearsAPI-3',
];
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  for (const n of WIKI_NAMES) {
    if (raw.includes(`](${n})`)) report(`WIKI LINK ](${n})  (in ${path.relative(ROOT, f)})`);
  }
  if (/\]\(images\//.test(raw)) report(`RELATIVE IMAGE  (in ${path.relative(ROOT, f)})`);
}

console.log('\n--- orphan pages (no inbound link, excluding index pages) ---');
for (const [u] of pages) {
  if (u === '/docs' || u.endsWith('/reference')) continue;
  if (!seenTargets.has(u) && ![...seenTargets].some((t) => t.split('#')[0] === u)) {
    console.log(`  (nav-only) ${u}`);
  }
}

console.log(`\n${problems === 0 ? 'OK - no link problems' : problems + ' PROBLEM(S)'}`);
process.exit(problems === 0 ? 0 : 1);
