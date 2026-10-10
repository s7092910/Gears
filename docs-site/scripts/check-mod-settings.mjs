// Checks the share code generator's logic (lib/share-code/mod-settings.ts and generator.ts) against
// the fixtures in lib/share-code/fixtures: that ModSettings.xml is read the way Gears reads it, and
// that a code built from edited values decodes to exactly those values under the right hashes.
// The hashes themselves match the C# side by check-share-code.mjs, so a code made here imports in game.
import fs from 'node:fs';
import path from 'node:path';
import { DOMParser } from '@xmldom/xmldom';
import { encode, validate, valuesEqual, modHash, settingHash, floatValue } from '../lib/share-code/format.ts';
import { readModName, readWorldSchema } from '../lib/share-code/mod-settings.ts';
import { buildWorldCode, matchCode, checkInput, valueText } from '../lib/share-code/generator.ts';

const FIXTURES = path.resolve(import.meta.dirname, '..', 'lib', 'share-code', 'fixtures');
const parse = (file) => new DOMParser().parseFromString(fs.readFileSync(path.join(FIXTURES, file), 'utf8'), 'text/xml');

let problems = 0;
function fail(message) {
  console.error(`  ${message}`);
  problems++;
}
function same(actual, expected, what) {
  const a = JSON.stringify(actual, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
  const e = JSON.stringify(expected);
  if (a !== e) fail(`${what}:\n    got      ${a}\n    expected ${e}`);
}

// ---- Reading ----

const name = readModName(parse('gears-example/ModInfo.xml'));
same(name, 'GearsExample', 'mod name (DisplayName must not be taken for Name)');

const example = readWorldSchema(parse('gears-example/ModSettings.xml'));
same(example, {
  settings: [
    { name: 'FeralNights', category: 'Zombies', element: 'Switch', valueType: 'bool', defaultValue: { kind: 'Bool', value: false } },
    { name: 'SpawnMultiplier', category: 'Zombies', element: 'Slider', valueType: 'int', defaultValue: { kind: 'Int', value: 1 }, increment: 1, min: 1, max: 4 },
    { name: 'LootRespawnDays', category: 'Zombies', element: 'Selector', valueType: 'int', defaultValue: { kind: 'Int', value: 7 }, increment: 1, min: 1, max: 30 },
  ],
  warnings: [],
}, 'GearsExample World schema');

const edge = readWorldSchema(parse('edge-cases/ModSettings.xml'));
same(edge.settings.map((s) => s.name), ['Difficulty', 'Mode', 'Weather', 'LootScale', 'Greeting', 'Merged'], 'edge case settings kept');
same(edge.settings[0], {
  name: 'Difficulty', category: 'Rules', element: 'Selector', valueType: 'enum', defaultValue: { kind: 'EnumName', value: 'Normal' },
  enumType: 'MyMod.Difficulty', options: ['Easy', 'Normal', 'Hard'],
}, 'enum selector with a List');
same(edge.settings[1].options, undefined, 'enum switch with no Buttons has no options');
same(edge.settings[2].options, ['Sunny', 'Stormy'], 'string switch Buttons');
same(edge.settings[3].defaultValue, floatValue(0.5), '50% default');
same([edge.settings[3].increment, edge.settings[3].min, edge.settings[3].max], [Math.fround(0.05), 0, 2], 'percentage range');
same(edge.settings[5].category, 'Rules', 'merged category');
same(edge.warnings.length, 5, `edge case warnings (${edge.warnings.join(' | ')})`);
for (const [setting, text] of [
  ['MissingDefault', 'no defaultValue'],
  ['StringSlider', 'Slider cannot use'],
  ['Precise', 'cannot use'],
  ['BadBool', 'not a valid bool'],
  ['Weather', 'more than once'],
]) {
  if (!edge.warnings.some((w) => w.includes(`'${setting}'`) && w.includes(text))) fail(`no warning for ${setting} (${text})`);
}

const v1 = readWorldSchema(new DOMParser().parseFromString('<ModSettings><World/></ModSettings>', 'text/xml'));
same([v1.settings.length, v1.warnings.length], [0, 1], 'a file with no version is refused');

// ---- Checking input ----

const spawn = example.settings[1];
same(checkInput(spawn, '3'), { value: { kind: 'Int', value: 3 } }, 'valid int');
if (!('error' in checkInput(spawn, '5'))) fail('an int above maxValue is accepted');
if (!('error' in checkInput(spawn, '2.5'))) fail('a fraction is accepted for an int');
if (!('error' in checkInput(edge.settings[1], 'not a name!'))) fail('an invalid enum name is accepted');
same(valueText(floatValue(0.1)), '0.1', 'float text is the shortest that reads back');

// ---- Building and opening codes ----

const loaded = [{ name, schema: example }];
const values = { GearsExample: { FeralNights: { kind: 'Bool', value: true }, SpawnMultiplier: { kind: 'Int', value: 3 }, LootRespawnDays: { kind: 'Int', value: 7 } } };
const stranger = { nameHash: modHash('SomeOtherMod'), settings: [{ hash: settingHash(null, null, 'X'), value: { kind: 'Int', value: 9 } }] };
const code = await encode(buildWorldCode(loaded, values, [stranger]));
const read = await validate(code);
if (!read.isValid) {
  fail(`built code not valid: ${read.errors.map((e) => e.message).join('; ')}`);
} else {
  const [mod, other] = read.shareCode.mods;
  same(read.shareCode.mods.length, 2, 'mods in the built code');
  same(mod.nameHash, modHash('GearsExample'), 'mod hash');
  same(mod.settings.map((s) => s.hash), [settingHash(null, null, 'FeralNights'), settingHash(null, null, 'SpawnMultiplier')],
    'only changed settings, by name hash (LootRespawnDays is at its default)');
  same(other, stranger, 'an entry nothing matched is carried over');

  const match = matchCode(read.shareCode.mods, loaded);
  same(match.matched, 2, 'matched settings');
  if (!valuesEqual(match.values.GearsExample.SpawnMultiplier, values.GearsExample.SpawnMultiplier)) fail('opened value differs');
  same(match.unmatched, [stranger], 'unmatched entries');
}

if (problems > 0) {
  console.error(`${problems} share code generator check(s) failed (${FIXTURES}).`);
  process.exit(1);
}
console.log('Share code generator reads the fixtures and builds codes as expected.');
