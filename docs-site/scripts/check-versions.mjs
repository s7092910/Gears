// Verifies every Gears, GearsAPI and GearsSharing version number written into the site matches the
// source: Gears' version from its ModInfo.xml, GearsAPI's from its AssemblyVersion, and
// GearsSharing's from the <Version> in its project file. The numbers are
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

// ModInfo.xml is untracked (see /.gitignore), so a CI checkout doesn't have it. Without it, the
// Gears versions are only checked against each other: the first one found becomes the expected one.
const MODINFO = 'Gears/Modlet/ModInfo.xml';
const hasModInfo = fs.existsSync(path.join(REPO, MODINFO));
let gears = hasModInfo ? sourceVersion(MODINFO, /<Version value="(\d+\.\d+\.\d+)"/, 'Gears') : null;
const gearsApi = sourceVersion(
  'GearsAPI/Properties/AssemblyInfo.cs',
  /\[assembly: AssemblyVersion\("(\d+\.\d+\.\d+)(?:\.\d+)?"\)\]/,
  'GearsAPI',
);
const gearsSharing = sourceVersion(
  'GearsSharing/GearsSharing.csproj',
  /<Version>(\d+\.\d+\.\d+)<\/Version>/,
  'GearsSharing',
);

// Each pattern captures one version number. Add an entry when a page states a version.
const CHECKS = [
  { file: 'content/docs/index.mdx', product: 'Gears', pattern: /\| Gears \(the mod players install\) \| (\S+) \|/ },
  { file: 'content/docs/index.mdx', product: 'GearsAPI', pattern: /\| GearsAPI\.dll \(the assembly mods reference\) \| (\S+) \|/ },
  { file: 'content/docs/index.mdx', product: 'GearsAPI', pattern: /Every public type in GearsAPI (\d+\.\d+\.\d+)/ },
  { file: 'content/docs/index.mdx', product: 'GearsSharing', pattern: /Every public type in GearsAPI \S+ and GearsSharing (\d+\.\d+\.\d+)/ },
  { file: 'content/docs/players/index.mdx', product: 'Gears', pattern: /\| Gears \| (\S+) \|/ },
  { file: 'app/(home)/page.tsx', product: 'Gears', pattern: /Gears (\d+\.\d+\.\d+) · GearsAPI\.dll/ },
  { file: 'app/(home)/page.tsx', product: 'GearsAPI', pattern: /GearsAPI\.dll (\d+\.\d+\.\d+)</ },
  // The generated reference takes every assembly's version from this config.
  { file: 'scripts/lib/model.mjs', product: 'GearsAPI', pattern: /name: 'GearsAPI\.dll', version: '(\d+\.\d+\.\d+)'/ },
  { file: 'scripts/lib/model.mjs', product: 'GearsSharing', pattern: /name: 'GearsSharing\.dll', version: '(\d+\.\d+\.\d+)'/ },
];

let problems = 0;
for (const { file, product, pattern } of CHECKS) {
  const m = read(path.join(SITE, file)).match(pattern);
  if (!m) {
    console.error(`${file}: the version text was not found (${pattern})`);
    problems++;
    continue;
  }
  if (product === 'Gears' && gears === null) gears = m[1];
  const expect = product === 'Gears' ? gears : product === 'GearsSharing' ? gearsSharing : gearsApi;
  if (m[1] !== expect) {
    const from = product === 'Gears' && !hasModInfo ? 'other pages say' : 'source says';
    console.error(`${file}: says ${m[1]}, ${from} ${expect}`);
    problems++;
  }
}

if (problems) {
  console.error(`\n${problems} version problem(s). Gears ${gears}, GearsAPI ${gearsApi}, GearsSharing ${gearsSharing}.`);
  process.exit(1);
}
if (hasModInfo) {
  console.log(`OK - every stated version matches Gears ${gears}, GearsAPI ${gearsApi} and GearsSharing ${gearsSharing}`);
} else {
  console.log(
    `OK - every stated version matches GearsAPI ${gearsApi} and GearsSharing ${gearsSharing}, and every page agrees on Gears ${gears}` +
      ` (${MODINFO} not found, so Gears was not checked against its source)`,
  );
}
