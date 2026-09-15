/**
 * Verifies the static export works under the `/Gears/` base path, the way GitHub Pages serves it.
 *
 * `npm start` serves `out/` from the ROOT, which cannot reproduce a basePath mistake — the usual
 * way a project-site deploy ships broken. So stage the export one level down first:
 *
 *   npm run build
 *   mkdir -p ../.preview && rm -rf ../.preview/Gears && cp -r out ../.preview/Gears
 *   npx serve ../.preview -l 4321
 *   node scripts/check-subpath.mjs
 */
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 4321);
const BASE = process.env.BASE_PATH ?? '/Gears';

const get = (p) =>
  new Promise((resolve) => {
    http
      .get({ host: '127.0.0.1', port: PORT, path: p }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body, location: res.headers.location }));
      })
      .on('error', (e) => resolve({ status: 0, body: String(e.message) }));
  });

const PAGES = [
  '/',
  '/docs/',
  '/docs/getting-started/',
  '/docs/xml/modsettings-reference/',
  '/docs/csharp/global-settings/',
  '/docs/reference/',
  '/docs/reference/settings/i-mod-setting/',
  '/docs/reference/attributes/setting-factory-fixed-attribute/',
  '/docs/setting-types/',
  '/images/Setting-Tabs.png',
];

let failures = 0;
const line = (status, path, extra = '') => {
  if (status !== 200) failures++;
  console.log(`${String(status).padEnd(4)} ${BASE}${path} ${extra}`);
};

const probe = await get(`${BASE}/`);
if (probe.status === 0) {
  console.error(`Nothing answering on port ${PORT}. Start the staged server first — see the header of this file.`);
  process.exit(2);
}

console.log('--- pages ---');
for (const p of PAGES) {
  const r = await get(`${BASE}${p}`);
  line(r.status, p, r.location ? `-> ${r.location}` : `len=${r.body.length}`);
}

console.log('\n--- assets referenced by a page with images ---');
const page = (await get(`${BASE}/docs/setting-types/`)).body;
const refs = [
  ...[...page.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]),
  ...[...page.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]),
  ...[...page.matchAll(/src="(\/[^"]+\.js)"/g)].map((m) => m[1]),
];
for (const u of [...new Set(refs)].slice(0, 12)) {
  if (!u.startsWith('/')) {
    console.log(`REL  ${u}   <-- relative URL, breaks under a subpath`);
    failures++;
    continue;
  }
  const r = await get(u);
  if (r.status !== 200) failures++;
  console.log(`${String(r.status).padEnd(4)} ${u}`);
}

console.log('\n--- static search index ---');
const search = await get(`${BASE}/api/search`);
if (search.status !== 200 || search.body.length < 1000) failures++;
console.log(`${String(search.status).padEnd(4)} ${BASE}/api/search  len=${search.body.length}`);

console.log(`\n${failures === 0 ? `OK - everything resolved under ${BASE}/` : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
