// Verifies every Gears and GearsAPI version number written into the site matches the source:
// Gears' version from its ModInfo.xml, and GearsAPI's from its AssemblyVersion. The numbers are
// typed into the pages rather than imported, because the "Send to AI" and llms.txt output use the
// page's markdown as written, and an import would leave `{gearsVersion}` in it instead of a number.
import fs from 'node:fs';
import path from 'node:path';

const SITE = path.resolve(import.meta.dirname, '..');
const REPO = path.resolve(SITE, '..');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function sourceVersion(file, pattern, label) {
  const m = read(path.join(REPO, file)).match(pattern);
  if (!m) {
    console.error(`could not find the ${label} version in ${file}`);
    process.exit(1);
  }
  return m[1];
}

const gears = sourceVersion('Gears/Modlet/ModInfo.xml', /<Version value="(\d+\.\d+\.\d+)"/, 'Gears');
const gearsApi = sourceVersion(
  'GearsAPI/Properties/AssemblyInfo.cs',
  /\[assembly: AssemblyVersion\("(\d+\.\d+\.\d+)(?:\.\d+)?"\)\]/,
  'GearsAPI',
);

// Each pattern captures one version number. Add an entry when a page states a version.
const CHECKS = [
  { file: 'content/docs/index.mdx', expect: gears, pattern: /\| Gears \(the mod players install\) \| (\S+) \|/ },
  { file: 'content/docs/index.mdx', expect: gearsApi, pattern: /\| GearsAPI\.dll \(the assembly mods reference\) \| (\S+) \|/ },
  { file: 'content/docs/index.mdx', expect: gearsApi, pattern: /Every public type in GearsAPI (\d+\.\d+\.\d+)/ },
  { file: 'content/docs/players/index.mdx', expect: gears, pattern: /\| Gears \| (\S+) \|/ },
  { file: 'app/(home)/page.tsx', expect: gears, pattern: /Gears (\d+\.\d+\.\d+) · GearsAPI\.dll/ },
  { file: 'app/(home)/page.tsx', expect: gearsApi, pattern: /GearsAPI\.dll (\d+\.\d+\.\d+)</ },
  { file: 'scripts/gen-api-reference.mjs', expect: gearsApi, pattern: /GearsAPI\.dll (\d+\.\d+\.\d+), one page per type/ },
  { file: 'scripts/gen-api-reference.mjs', expect: gearsApi, pattern: /\$\{ASSEMBLY\}\\` (\d+\.\d+\.\d+) —/ },
  { file: 'scripts/gen-api-reference.mjs', expect: gearsApi, pattern: /Every public type in GearsAPI (\d+\.\d+\.\d+)'/ },
];

let problems = 0;
for (const { file, expect, pattern } of CHECKS) {
  const m = read(path.join(SITE, file)).match(pattern);
  if (!m) {
    console.error(`${file}: the version text was not found (${pattern})`);
    problems++;
  } else if (m[1] !== expect) {
    console.error(`${file}: says ${m[1]}, source says ${expect}`);
    problems++;
  }
}

if (problems) {
  console.error(`\n${problems} version problem(s). Gears ${gears}, GearsAPI ${gearsApi}.`);
  process.exit(1);
}
console.log(`OK - every stated version matches Gears ${gears} and GearsAPI ${gearsApi}`);
