// Checks the TypeScript share code port (lib/share-code/format.ts) against the vectors the C#
// library is tested with too (lib/share-code/vectors.json), so a code made by the game reads the
// same here and a code made here reads the same in the game. Node runs the .ts file directly.
import fs from 'node:fs';
import path from 'node:path';
import { PREFIX, MAX_CODE_LENGTH, encode, validate, valuesEqual, formatValue, pathOf, modHash, settingHash } from '../lib/share-code/format.ts';

const VECTORS = path.resolve(import.meta.dirname, '..', 'lib', 'share-code', 'vectors.json');
const vectors = JSON.parse(fs.readFileSync(VECTORS, 'utf8'));

function bits(hex) {
  return parseInt(hex, 16) >>> 0;
}

function valueFromJson(json) {
  switch (json.kind) {
    case 'Float':
      return { kind: 'Float', bits: bits(json.bits) };
    case 'Color':
      return { kind: 'Color', bits: json.bits.map(bits) };
    case 'EnumValue':
      return { kind: 'EnumValue', value: BigInt(json.value) };
    default:
      return { kind: json.kind, value: json.value };
  }
}

function modelFromJson(vector) {
  return {
    scope: vector.scope,
    mods: vector.mods.map((mod) => ({
      name: mod.name,
      settings: mod.settings.map((s) => ({
        ...(s.tab !== undefined ? { tab: s.tab, category: s.category } : {}),
        name: s.name,
        value: valueFromJson(s.value),
      })),
    })),
  };
}

/**
 * Returns the first difference between a model with names and a decoded one (hashes only), or
 * null if they match.
 */
function difference(expected, actual) {
  if (expected.scope !== actual.scope) return `scope ${actual.scope}, expected ${expected.scope}`;
  if (expected.mods.length !== actual.mods.length) return `${actual.mods.length} mods, expected ${expected.mods.length}`;
  for (let m = 0; m < expected.mods.length; m++) {
    const e = expected.mods[m];
    const a = actual.mods[m];
    if (modHash(e.name) !== a.nameHash) return `mod #${a.nameHash.toString(16)}, expected '${e.name}'`;
    if (e.settings.length !== a.settings.length) return `${e.name}: ${a.settings.length} settings, expected ${e.settings.length}`;
    for (let s = 0; s < e.settings.length; s++) {
      const es = e.settings[s];
      const as = a.settings[s];
      const where = pathOf(e, es);
      if (settingHash(es.tab, es.category, es.name) !== as.hash) {
        return `${where}: read as ${pathOf(a, as)}`;
      }
      if (!valuesEqual(es.value, as.value)) {
        return `${where}: ${as.value.kind} ${formatValue(as.value)}, expected ${es.value.kind} ${formatValue(es.value)}`;
      }
    }
  }
  return null;
}

let problems = 0;
function fail(message) {
  console.error(`  ${message}`);
  problems++;
}

// Both sides hash names the same way, or no code would match a setting.
for (const vector of vectors.hashes) {
  const hash = vector.tab !== undefined ? settingHash(vector.tab, vector.category, vector.text) : modHash(vector.text);
  if (hash !== bits(vector.hash)) {
    fail(`hash of ${JSON.stringify(vector)}: ${hash.toString(16).padStart(8, '0')}`);
  }
}

for (const vector of vectors.valid) {
  const model = modelFromJson(vector);

  // A code the C# encoder made reads back as the model.
  const result = await validate(vector.code);
  if (!result.isValid) {
    fail(`${vector.name}: not valid: ${result.errors.map((e) => e.message).join('; ')}`);
  } else {
    const diff = difference(model, result.shareCode);
    if (diff) fail(`${vector.name}: ${diff}`);
  }

  // The model survives this side's encoder. The bytes can differ from the C# code (each side's
  // deflate is its own), so the check is the decoded model, not the string.
  const code = await encode(model);
  if (!code.startsWith(PREFIX)) fail(`${vector.name}: own encoding does not start with '${PREFIX}'`);
  const back = await validate(code);
  if (!back.isValid) {
    fail(`${vector.name}: own encoding not valid: ${back.errors.map((e) => e.message).join('; ')}`);
  } else {
    const diff = difference(model, back.shareCode);
    if (diff) fail(`${vector.name}: after encode and decode, ${diff}`);
  }
}

for (const vector of vectors.invalid) {
  const result = await validate(vector.code);
  if (result.isValid) {
    fail(`${vector.name}: accepted, expected ${vector.error}`);
  } else if (result.errors[0].kind !== vector.error) {
    fail(`${vector.name}: ${result.errors[0].kind} (${result.errors[0].message}), expected ${vector.error}`);
  }
}

// The length cap: a code too long to paste is never written, but one is still read.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function noise(length) {
  let seed = 12345;
  let text = '';
  for (let i = 0; i < length; i++) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    text += ALPHABET[seed >>> 26];
  }
  return text;
}

const tooLong = { scope: 'World', mods: [{ name: 'M', settings: [{ name: 'S', value: { kind: 'String', value: noise(40000) } }] }] };
try {
  const code = await encode(tooLong);
  fail(`a ${code.length} character code was written, over the ${MAX_CODE_LENGTH} cap`);
} catch (e) {
  if (!(e instanceof RangeError)) throw e;
}

const longText = noise(30000);
const longPayload = [0x11, 1, ...le(modHash('M')), 1, ...le(settingHash(null, null, 'S')), 6, ...varint(longText.length), ...Buffer.from(longText)];
const longCode = PREFIX + Buffer.from(longPayload).toString('base64url');
const longResult = await validate(longCode);
if (longCode.length <= MAX_CODE_LENGTH || !longResult.isValid || longResult.shareCode.mods[0].settings[0].value.value !== longText) {
  fail(`a ${longCode.length} character code is not read back`);
}

function le(hash) {
  return [hash & 0xff, (hash >>> 8) & 0xff, (hash >>> 16) & 0xff, hash >>> 24];
}

function varint(value) {
  const bytes = [];
  for (; value >= 0x80; value >>>= 7) bytes.push((value & 0x7f) | 0x80);
  bytes.push(value);
  return bytes;
}

if (problems > 0) {
  console.error(`${problems} share code vector check(s) failed (${VECTORS}).`);
  process.exit(1);
}
console.log(`Share code port matches all ${vectors.hashes.length + vectors.valid.length + vectors.invalid.length} vectors.`);
