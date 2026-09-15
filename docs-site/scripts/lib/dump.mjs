// Debug aid: parse the GearsAPI sources and print what the parser found.
import fs from 'node:fs';
import path from 'node:path';
import { parseFile, memberKey } from './csharp.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..', 'GearsAPI', 'Source');

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.cs') ? [p] : [];
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
    if (t.doc) console.log(`      doc: ${t.doc.slice(0, 90)}${t.doc.length > 90 ? '…' : ''}`);
    for (const m of t.members) {
      memberCount++;
      console.log(`      - ${m.kind.padEnd(11)} ${memberKey(m).padEnd(38)} ${m.signature ?? ''}`);
    }
  }
}
console.log(`\nfiles=${files} types=${typeCount} members=${memberCount}`);
