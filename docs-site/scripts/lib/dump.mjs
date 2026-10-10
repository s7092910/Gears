// Debug aid: parse a source folder and print what the parser found, members of every visibility
// included. `node scripts/lib/dump.mjs [folder]`, the folder relative to the repo root; defaults to
// GearsAPI/Source. For GearsSharing: `node scripts/lib/dump.mjs GearsSharing`.
import fs from 'node:fs';
import path from 'node:path';
import { parseFile, memberKey } from './csharp.mjs';

const REPO = path.resolve(import.meta.dirname, '..', '..', '..');
const ROOT = path.resolve(REPO, process.argv[2] ?? 'GearsAPI/Source');

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === 'bin' || e.name === 'obj' ? [] : walk(p);
    return p.endsWith('.cs') ? [p] : [];
  });
}

const byNs = new Map();
let files = 0;
for (const f of walk(ROOT).sort()) {
  files++;
  for (const ns of parseFile(fs.readFileSync(f, 'utf8'), f)) {
    if (!byNs.has(ns.name)) byNs.set(ns.name, []);
    byNs.get(ns.name).push(...ns.types);
  }
}

let typeCount = 0;
let memberCount = 0;
for (const [ns, types] of [...byNs].sort()) {
  console.log(`\n### ${ns}  (${types.length} types)`);
  for (const t of types) {
    typeCount++;
    const g = t.typeParams?.length ? `<${t.typeParams.join(', ')}>` : '';
    const nested = t.declaringType ? `  [nested in ${t.declaringType}]` : '';
    console.log(`  ${t.modifiers.join(' ')} ${t.kind} ${t.name}${g}${t.bases?.length ? ' : ' + t.bases.join(', ') : ''}${t.constraints ? ' ' + t.constraints : ''}${nested}`);
    const summary = t.doc?.summary;
    if (summary) console.log(`      doc: ${summary.slice(0, 90)}${summary.length > 90 ? '…' : ''}`);
    for (const m of t.members) {
      memberCount++;
      console.log(`      - ${m.kind.padEnd(11)} ${memberKey(m).padEnd(38)} ${m.signature ?? ''}`);
    }
  }
}
console.log(`\nfiles=${files} types=${typeCount} members=${memberCount}`);
