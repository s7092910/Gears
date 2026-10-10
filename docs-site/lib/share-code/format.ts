// The Gears share code format, ported from GearsSharing/ShareCodeFormat.cs so a browser can read,
// check, edit and write the same codes the game makes. Both sides are checked against
// vectors.json (scripts/check-share-code.mjs here, ShareCodeFormatTests in C#).
//
// A code is `Gears:` then one header byte and a payload, as unpadded URL-safe base64:
// - Header: bits 0-3 format version (1), bit 4 set for World, bit 5 set when the payload is raw-deflated.
// - Payload, for both scopes: count { modHash; count { settingHash; value } }
// - Names are not stored, only their hashes (modHash, settingHash): 32 bits each, little-endian.
//   Whoever reads the code matches them against the mods they know.
// - Counts are 7-bit varints, each value a type tag then its data. An empty payload means no mods.
// - A code is at most MAX_CODE_LENGTH characters when written; longer ones still decode.
//
// Floats and color channels are kept as their 32-bit patterns, not JS numbers, so NaN payloads and
// -0 survive an edit untouched. Uses only erasable TypeScript, so Node can run it directly.

export type ShareCodeScope = 'Global' | 'World';

export type SharedValue =
  | { kind: 'Bool'; value: boolean }
  | { kind: 'Int'; value: number }
  /** `bits`: the float's IEEE 754 single-precision pattern, as an unsigned 32-bit number. */
  | { kind: 'Float'; bits: number }
  | { kind: 'String'; value: string | null }
  | { kind: 'EnumName'; value: string }
  /** An enum value with no member name of its own (a flags combination). */
  | { kind: 'EnumValue'; value: bigint }
  /** `bits`: RGBA channels as single-precision patterns; channels are normally 0 to 1. */
  | { kind: 'Color'; bits: [number, number, number, number] }
  /** A mod-registered type, as written by that type's own serializer. */
  | { kind: 'Serialized'; value: string };

export type SharedValueKind = SharedValue['kind'];

/**
 * A code holds only a hash of each setting's address. To encode, set the names and the hash is
 * worked out from them. A decoded setting has only `hash`; match it with `settingHash`.
 */
export interface SharedSetting {
  /** The tab name. Absent or `null` for a World setting or in a decoded code. */
  tab?: string | null;
  /** The category name. Absent or `null` for a World setting or in a decoded code. */
  category?: string | null;
  /** The setting name. Absent or `null` in a decoded code. */
  name?: string | null;
  /** The hash of the setting's address. Only used while `name` is absent. */
  hash?: number;
  value: SharedValue;
}

/**
 * A code holds only a hash of each mod name. To encode, set `name` and the hash is worked out from
 * it. A decoded mod has only `nameHash`; match it with `modHash`.
 */
export interface SharedMod {
  /** The mod's name, as in its ModInfo.xml. Absent or `null` in a decoded code. */
  name?: string | null;
  /** The hash of the mod's name. Only used while `name` is absent. */
  nameHash?: number;
  /** Written in the order listed. */
  settings: SharedSetting[];
}

export interface ShareCode {
  scope: ShareCodeScope;
  mods: SharedMod[];
}

export type ShareCodeErrorKind =
  | 'Empty'
  | 'MissingPrefix'
  | 'InvalidBase64'
  | 'UnsupportedVersion'
  | 'CorruptCompression'
  | 'TooLarge'
  | 'Truncated'
  | 'MalformedData'
  | 'TrailingData'
  | 'DuplicateSetting';

export interface ShareCodeError {
  kind: ShareCodeErrorKind;
  /** Suitable for showing to a player. */
  message: string;
}

export interface ShareCodeValidationResult {
  isValid: boolean;
  errors: ShareCodeError[];
  /**
   * Set whenever the code could be read, even if a mod or setting is repeated, so an editor can
   * show what is there; `null` if it could not be read.
   */
  shareCode: ShareCode | null;
}

/** Thrown by `decode` for a code that is not valid. */
export class ShareCodeFormatError extends Error {
  readonly kind: ShareCodeErrorKind;

  constructor(kind: ShareCodeErrorKind, message: string) {
    super(message);
    this.name = 'ShareCodeFormatError';
    this.kind = kind;
  }
}

const FORMAT_VERSION = 1;
const VERSION_MASK = 0x0f;
const WORLD_SCOPE_FLAG = 0x10;
const COMPRESSED_FLAG = 0x20;

/** The most a payload may decompress to; stops a tampered code from inflating without limit. */
export const MAX_PAYLOAD_BYTES = 1 << 20;

/**
 * The longest code `encode` writes, prefix included: the usual limit of a single-line text field,
 * so a code pastes anywhere. Decoding does not enforce it.
 */
export const MAX_CODE_LENGTH = 32767;

/** Starts every share code, so a player can tell one apart from other text. Case-sensitive. */
export const PREFIX = 'Gears:';

// Wire tags. Several kinds have a compact form the writer picks automatically.
const TAG_FALSE = 0;
const TAG_TRUE = 1;
const TAG_INT = 2;
const TAG_WHOLE_FLOAT = 3;
const TAG_FLOAT = 4;
const TAG_NULL_STRING = 5;
const TAG_STRING = 6;
const TAG_ENUM_NAME = 7;
const TAG_ENUM_VALUE = 8;
const TAG_COLOR32 = 9;
const TAG_COLOR = 10;
const TAG_SERIALIZED = 11;

// A whole float is only worth a varint while the varint stays under the 4 raw bytes.
const WHOLE_FLOAT_LIMIT = 1 << 20;

// ---- Float bit helpers ----

const floatView = new DataView(new ArrayBuffer(4));

/** Rounds `value` to single precision and returns its bit pattern. */
export function floatToBits(value: number): number {
  floatView.setFloat32(0, value, true);
  return floatView.getUint32(0, true);
}

/** Returns the single-precision float with bit pattern `bits`, as a JS number (exact). */
export function bitsToFloat(bits: number): number {
  floatView.setUint32(0, bits >>> 0, true);
  return floatView.getFloat32(0, true);
}

/** Creates a Float value from a number, rounded to single precision as the game stores it. */
export function floatValue(value: number): SharedValue {
  return { kind: 'Float', bits: floatToBits(value) };
}

/** Creates a Color value from RGBA channels, normally 0 to 1. */
export function colorValue(r: number, g: number, b: number, a: number): SharedValue {
  return { kind: 'Color', bits: [floatToBits(r), floatToBits(g), floatToBits(b), floatToBits(a)] };
}

/** Returns `true` if both values have the same kind and the same bits. */
export function valuesEqual(x: SharedValue, y: SharedValue): boolean {
  switch (x.kind) {
    case 'Float':
      return y.kind === 'Float' && x.bits === y.bits;
    case 'Color':
      return y.kind === 'Color' && x.bits.every((bits, i) => bits === y.bits[i]);
    default:
      return x.kind === y.kind && x.value === (y as typeof x).value;
  }
}

/** Formats a value for display, as the C# `SharedValue.ToString` does. */
export function formatValue(value: SharedValue): string {
  switch (value.kind) {
    case 'Bool':
      return value.value ? 'True' : 'False';
    case 'Int':
      return String(value.value);
    case 'Float':
      return String(bitsToFloat(value.bits));
    case 'EnumValue':
      return value.value.toString();
    case 'Color':
      return value.bits.map((bits) => String(bitsToFloat(bits))).join(',');
    default:
      return value.value ?? 'null';
  }
}

/**
 * Returns the display path: `Mod/Tab/Category/Setting` for Global, `Mod/Setting` for World.
 * A mod or setting with no name (as decoded) shows its hash instead, as `#1a2b3c4d`.
 */
export function pathOf(mod: SharedMod, setting: SharedSetting): string {
  const modPart = mod.name ?? hashLabel(mod.nameHash ?? 0);
  if (setting.name == null) {
    return `${modPart}/${hashLabel(setting.hash ?? 0)}`;
  }
  return setting.tab == null && setting.category == null
    ? `${modPart}/${setting.name}`
    : `${modPart}/${setting.tab}/${setting.category}/${setting.name}`;
}

function hashLabel(hash: number): string {
  return '#' + (hash >>> 0).toString(16).padStart(8, '0');
}

// ---- Hashes ----

const utf8Encoder = new TextEncoder();

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(text: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (const b of utf8Encoder.encode(text)) {
    hash = Math.imul(hash ^ b, FNV_PRIME);
  }
  return hash >>> 0;
}

/** Returns the hash a code holds for the mod named `mod`: 32-bit FNV-1a of its UTF-8. */
export function modHash(mod: string): number {
  return fnv1a(mod);
}

/**
 * Returns the hash a code holds for a setting: 32-bit FNV-1a of the UTF-8 of
 * `tab + "\0" + category + "\0" + name` for a Global setting, or of `name` alone for a World
 * setting (`tab` and `category` absent).
 */
export function settingHash(tab: string | null | undefined, category: string | null | undefined, name: string): number {
  return tab == null && category == null ? fnv1a(name) : fnv1a(`${tab}\0${category}\0${name}`);
}

function modAddress(mod: SharedMod): number {
  return mod.name != null ? modHash(mod.name) : (mod.nameHash as number);
}

function settingAddress(setting: SharedSetting): number {
  return setting.name != null ? settingHash(setting.tab, setting.category, setting.name) : (setting.hash as number);
}

// ---- Payload ----
// fatal: reject invalid UTF-8 as the C# side does. ignoreBOM: keep a leading U+FEFF as a character.
const utf8Decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

class PayloadWriter {
  private bytes: number[] = [];

  writeByte(value: number): void {
    this.bytes.push(value & 0xff);
  }

  writeVarULong(value: bigint): void {
    let v = BigInt.asUintN(64, value);
    while (v >= 0x80n) {
      this.bytes.push(Number(v & 0x7fn) | 0x80);
      v >>= 7n;
    }
    this.bytes.push(Number(v));
  }

  writeVarLong(value: bigint): void {
    const v = BigInt.asIntN(64, value);
    this.writeVarULong((v << 1n) ^ (v >> 63n));
  }

  writeCount(count: number): void {
    this.writeVarULong(BigInt(count));
  }

  writeString(value: string): void {
    const encoded = utf8Encoder.encode(value);
    this.writeCount(encoded.length);
    for (const b of encoded) {
      this.bytes.push(b);
    }
  }

  writeUInt32(value: number): void {
    const b = value >>> 0;
    this.bytes.push(b & 0xff, (b >>> 8) & 0xff, (b >>> 16) & 0xff, (b >>> 24) & 0xff);
  }

  toArray(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

class PayloadReader {
  private position = 0;
  private readonly data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  get atEnd(): boolean {
    return this.position >= this.data.length;
  }

  private get remaining(): number {
    return this.data.length - this.position;
  }

  readByte(): number {
    if (this.position >= this.data.length) {
      throw new ShareCodeFormatError('Truncated', 'The share code ends unexpectedly.');
    }
    return this.data[this.position++];
  }

  readVarULong(): bigint {
    let result = 0n;
    for (let shift = 0n; shift < 64n; shift += 7n) {
      const b = this.readByte();
      result = BigInt.asUintN(64, result | (BigInt(b & 0x7f) << shift));
      if ((b & 0x80) === 0) {
        return result;
      }
    }
    throw new ShareCodeFormatError('MalformedData', 'The share code holds a malformed number.');
  }

  readVarLong(): bigint {
    const raw = this.readVarULong();
    return BigInt.asIntN(64, (raw >> 1n) ^ -(raw & 1n));
  }

  readVarInt(): number {
    const value = this.readVarLong();
    if (value < -2147483648n || value > 2147483647n) {
      throw new ShareCodeFormatError('MalformedData', 'The share code holds an out of range number.');
    }
    return Number(value);
  }

  /**
   * Every counted item takes at least one byte, so a count larger than the bytes left is corrupt.
   */
  readCount(): number {
    const count = this.readVarULong();
    if (count > BigInt(this.remaining)) {
      throw new ShareCodeFormatError('MalformedData', 'The share code holds an impossible count.');
    }
    return Number(count);
  }

  readString(): string {
    const length = this.readVarULong();
    if (length > BigInt(this.remaining)) {
      throw new ShareCodeFormatError('Truncated', 'The share code ends unexpectedly.');
    }
    const end = this.position + Number(length);
    try {
      return utf8Decoder.decode(this.data.subarray(this.position, end));
    } catch {
      throw new ShareCodeFormatError('MalformedData', 'The share code holds invalid text.');
    } finally {
      this.position = end;
    }
  }

  readUInt32(): number {
    const b0 = this.readByte();
    const b1 = this.readByte();
    const b2 = this.readByte();
    const b3 = this.readByte();
    return (b0 | (b1 << 8) | (b2 << 16) | (b3 << 24)) >>> 0;
  }
}

// ---- Values ----

function isWholeFloat(bits: number): boolean {
  const value = bitsToFloat(bits);
  return value > -WHOLE_FLOAT_LIMIT && value < WHOLE_FLOAT_LIMIT && Number.isInteger(value) && !Object.is(value, -0);
}

/** A color picked in the UI is always whole 0-255 channels, which fit in a byte each. */
function channelByte(bits: number): number | null {
  const channel = bitsToFloat(bits);
  if (!(channel >= 0 && channel <= 1)) {
    return null;
  }
  const b = Math.round(channel * 255);
  return floatToBits(b / 255) === bits ? b : null;
}

function writeValue(writer: PayloadWriter, value: SharedValue): void {
  switch (value.kind) {
    case 'Bool':
      writer.writeByte(value.value ? TAG_TRUE : TAG_FALSE);
      break;
    case 'Int':
      writer.writeByte(TAG_INT);
      writer.writeVarLong(BigInt(value.value));
      break;
    case 'Float':
      if (isWholeFloat(value.bits)) {
        writer.writeByte(TAG_WHOLE_FLOAT);
        writer.writeVarLong(BigInt(bitsToFloat(value.bits)));
      } else {
        writer.writeByte(TAG_FLOAT);
        writer.writeUInt32(value.bits);
      }
      break;
    case 'String':
      if (value.value === null) {
        writer.writeByte(TAG_NULL_STRING);
      } else {
        writer.writeByte(TAG_STRING);
        writer.writeString(value.value);
      }
      break;
    case 'EnumName':
      writer.writeByte(TAG_ENUM_NAME);
      writer.writeString(value.value);
      break;
    case 'EnumValue':
      writer.writeByte(TAG_ENUM_VALUE);
      writer.writeVarLong(value.value);
      break;
    case 'Color': {
      const bytes = value.bits.map(channelByte);
      if (bytes.every((b) => b !== null)) {
        writer.writeByte(TAG_COLOR32);
        for (const b of bytes) {
          writer.writeByte(b as number);
        }
      } else {
        writer.writeByte(TAG_COLOR);
        for (const bits of value.bits) {
          writer.writeUInt32(bits);
        }
      }
      break;
    }
    case 'Serialized':
      writer.writeByte(TAG_SERIALIZED);
      writer.writeString(value.value);
      break;
  }
}

function readValue(reader: PayloadReader): SharedValue {
  const tag = reader.readByte();
  switch (tag) {
    case TAG_FALSE:
      return { kind: 'Bool', value: false };
    case TAG_TRUE:
      return { kind: 'Bool', value: true };
    case TAG_INT:
      return { kind: 'Int', value: reader.readVarInt() };
    case TAG_WHOLE_FLOAT:
      return { kind: 'Float', bits: floatToBits(reader.readVarInt()) };
    case TAG_FLOAT:
      return { kind: 'Float', bits: reader.readUInt32() };
    case TAG_NULL_STRING:
      return { kind: 'String', value: null };
    case TAG_STRING:
      return { kind: 'String', value: reader.readString() };
    case TAG_ENUM_NAME:
      return { kind: 'EnumName', value: reader.readString() };
    case TAG_ENUM_VALUE:
      return { kind: 'EnumValue', value: reader.readVarLong() };
    case TAG_COLOR32: {
      const bits: [number, number, number, number] = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        bits[i] = floatToBits(reader.readByte() / 255);
      }
      return { kind: 'Color', bits };
    }
    case TAG_COLOR:
      return {
        kind: 'Color',
        bits: [reader.readUInt32(), reader.readUInt32(), reader.readUInt32(), reader.readUInt32()],
      };
    case TAG_SERIALIZED:
      return { kind: 'Serialized', value: reader.readString() };
    default:
      throw new ShareCodeFormatError('MalformedData', `The share code holds an unknown value type (${tag}).`);
  }
}

// ---- Encoding ----

/**
 * Encodes `code` as a share code string. Mods with no settings are left out.
 * Throws a `TypeError` if a name is empty, a mod or setting appears twice (or hashes the same as
 * another), a Global setting has no tab or category, or a World setting or one with no name has one.
 * Throws a `RangeError` if the code would be longer than `MAX_CODE_LENGTH`.
 */
export async function encode(code: ShareCode): Promise<string> {
  const mods = code.mods.filter((mod) => mod != null && mod.settings.length > 0);
  checkForEncoding(code.scope, mods);

  const writer = new PayloadWriter();
  if (mods.length > 0) {
    writer.writeCount(mods.length);
    for (const mod of mods) {
      writer.writeUInt32(modAddress(mod));
      writer.writeCount(mod.settings.length);
      for (const setting of mod.settings) {
        writer.writeUInt32(settingAddress(setting));
        writeValue(writer, setting.value);
      }
    }
  }

  const text = await toText(code.scope, writer.toArray());
  if (text.length > MAX_CODE_LENGTH) {
    throw new RangeError(
      `The share code would be ${text.length} characters, more than the ${MAX_CODE_LENGTH} a code may have. ` +
        'Change fewer settings from their defaults.',
    );
  }
  return text;
}

/**
 * A mod or setting with a name is addressed by the name's hash; one without (as decoded) by the
 * hash it holds. Either way no two may share a hash, or the code could not tell them apart.
 */
function checkForEncoding(scope: ShareCodeScope, mods: SharedMod[]): void {
  const modHashes = new Map<number, string>();
  for (const mod of mods) {
    if (mod.name != null) {
      requireName(mod.name, 'mod');
    } else {
      requireHash(mod.nameHash, 'mod');
    }
    const modLabel = mod.name ?? hashLabel(mod.nameHash as number);
    requireUniqueHash(modHashes, modAddress(mod), `mod '${modLabel}'`);

    const settingHashes = new Map<number, string>();
    for (const setting of mod.settings) {
      if (setting.name == null) {
        if (setting.tab != null || setting.category != null) {
          throw new TypeError('A setting with no name cannot have a tab or category.');
        }
        requireHash(setting.hash, 'setting');
      } else {
        if (scope === 'Global') {
          requireName(setting.tab, 'tab');
          requireName(setting.category, 'category');
        } else if (setting.tab != null || setting.category != null) {
          throw new TypeError(`World setting '${setting.name}' cannot have a tab or category.`);
        }
        requireName(setting.name, 'setting');
      }

      const path = pathOf(mod, setting);
      requireUniqueHash(settingHashes, settingAddress(setting), `setting '${path}'`);
      checkValue(path, setting.value);
    }
  }
}

function requireHash(hash: number | undefined, what: string): void {
  if (!Number.isInteger(hash) || (hash as number) < 0 || (hash as number) > 0xffffffff) {
    throw new TypeError(`A ${what} has neither a name nor a 32-bit hash.`);
  }
}

function requireUniqueHash(seen: Map<number, string>, hash: number, what: string): void {
  const other = seen.get(hash);
  if (other !== undefined) {
    throw new TypeError(
      other === what
        ? `The ${what} is listed twice.`
        : `The ${other} and the ${what} have the same hash, so a code cannot tell them apart.`,
    );
  }
  seen.set(hash, what);
}

function requireName(name: string | null | undefined, what: string): void {
  if (!name) {
    throw new TypeError(`A ${what} name is null or empty.`);
  }
  if (!name.isWellFormed()) {
    throw new TypeError(`The ${what} name '${name}' is not valid text.`);
  }
}

/** Catches what the type system cannot: values a hand-edited model could get out of range. */
function checkValue(path: string, value: SharedValue): void {
  const bad = (why: string) => new TypeError(`The value of '${path}' ${why}.`);
  switch (value.kind) {
    case 'Int':
      if (!Number.isInteger(value.value) || value.value < -2147483648 || value.value > 2147483647) {
        throw bad('is not a 32-bit integer');
      }
      break;
    case 'Float':
      if (!Number.isInteger(value.bits) || value.bits < 0 || value.bits > 0xffffffff) {
        throw bad('is not a 32-bit float pattern');
      }
      break;
    case 'Color':
      if (value.bits.length !== 4 || !value.bits.every((b) => Number.isInteger(b) && b >= 0 && b <= 0xffffffff)) {
        throw bad('is not four 32-bit float patterns');
      }
      break;
    case 'EnumValue':
      if (value.value < -(2n ** 63n) || value.value >= 2n ** 63n) {
        throw bad('is not a 64-bit integer');
      }
      break;
    case 'String':
      if (value.value !== null && !value.value.isWellFormed()) {
        throw bad('is not valid text');
      }
      break;
    case 'EnumName':
    case 'Serialized':
      if (typeof value.value !== 'string' || !value.value.isWellFormed()) {
        throw bad('is not valid text');
      }
      break;
  }
}

async function toText(scope: ShareCodeScope, payload: Uint8Array): Promise<string> {
  let header = FORMAT_VERSION;
  if (scope === 'World') {
    header |= WORLD_SCOPE_FLAG;
  }

  let body = payload;
  if (payload.length > 0) {
    const deflated = await deflateRaw(payload);
    if (deflated.length < payload.length) {
      body = deflated;
      header |= COMPRESSED_FLAG;
    }
  }

  const bytes = new Uint8Array(body.length + 1);
  bytes[0] = header;
  bytes.set(body, 1);

  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return PREFIX + btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ---- Decoding ----

/**
 * Decodes and checks `code`. Never throws for bad input; every problem is reported in `errors`.
 */
export async function validate(code: string): Promise<ShareCodeValidationResult> {
  let shareCode: ShareCode;
  try {
    shareCode = await decodeUnchecked(code);
  } catch (e) {
    if (e instanceof ShareCodeFormatError) {
      return { isValid: false, errors: [{ kind: e.kind, message: e.message }], shareCode: null };
    }
    throw e;
  }

  const errors = findRepeats(shareCode);
  return { isValid: errors.length === 0, errors, shareCode };
}

/** Decodes `code`, throwing a `ShareCodeFormatError` with the first problem if it is not valid. */
export async function decode(code: string): Promise<ShareCode> {
  const result = await validate(code);
  if (!result.isValid) {
    const first = result.errors[0];
    throw new ShareCodeFormatError(first.kind, first.message);
  }
  return result.shareCode as ShareCode;
}

async function decodeUnchecked(code: string): Promise<ShareCode> {
  const bytes = fromText(code);

  const header = bytes[0];
  if ((header & VERSION_MASK) !== FORMAT_VERSION || (header & ~(VERSION_MASK | WORLD_SCOPE_FLAG | COMPRESSED_FLAG)) !== 0) {
    throw new ShareCodeFormatError('UnsupportedVersion', 'The share code was made by an unsupported version of Gears.');
  }

  const shareCode: ShareCode = { scope: (header & WORLD_SCOPE_FLAG) !== 0 ? 'World' : 'Global', mods: [] };

  let payload = bytes.subarray(1);
  if ((header & COMPRESSED_FLAG) !== 0) {
    payload = await inflateRaw(payload);
  }

  const reader = new PayloadReader(payload);
  const modCount = reader.atEnd ? 0 : reader.readCount();
  for (let m = 0; m < modCount; m++) {
    const mod: SharedMod = { nameHash: reader.readUInt32(), settings: [] };
    const settingCount = reader.readCount();
    for (let s = 0; s < settingCount; s++) {
      const hash = reader.readUInt32();
      mod.settings.push({ hash, value: readValue(reader) });
    }
    shareCode.mods.push(mod);
  }

  if (!reader.atEnd) {
    throw new ShareCodeFormatError('TrailingData', 'The share code has unexpected data after the last setting.');
  }
  return shareCode;
}

/** Reading succeeded; reports repeats a hand-edited code could still have. */
function findRepeats(shareCode: ShareCode): ShareCodeError[] {
  const errors: ShareCodeError[] = [];
  const modHashes = new Set<number>();

  for (const mod of shareCode.mods) {
    const nameHash = mod.nameHash as number;
    if (modHashes.has(nameHash)) {
      errors.push({ kind: 'DuplicateSetting', message: `The mod '${hashLabel(nameHash)}' appears more than once.` });
    }
    modHashes.add(nameHash);

    const settingHashes = new Set<number>();
    for (const setting of mod.settings) {
      const hash = setting.hash as number;
      if (settingHashes.has(hash)) {
        errors.push({ kind: 'DuplicateSetting', message: `The setting '${pathOf(mod, setting)}' appears more than once.` });
      }
      settingHashes.add(hash);
    }
  }
  return errors;
}

function fromText(code: string): Uint8Array {
  const text = (code ?? '').trim();
  if (text.length === 0) {
    throw new ShareCodeFormatError('Empty', 'The share code is empty.');
  }
  if (!text.startsWith(PREFIX)) {
    throw new ShareCodeFormatError('MissingPrefix', `This is not a Gears share code; it should start with '${PREFIX}'.`);
  }

  let base64 = text.slice(PREFIX.length).replace(/\s+/g, '');
  if (base64.length === 0) {
    throw new ShareCodeFormatError('Empty', 'The share code is empty.');
  }

  base64 = base64.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*$/.test(base64) || base64.length % 4 === 1) {
    throw invalidBase64();
  }
  base64 += '='.repeat((4 - (base64.length % 4)) % 4);

  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw invalidBase64();
  }
  if (binary.length === 0) {
    throw new ShareCodeFormatError('Empty', 'The share code is empty.');
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function invalidBase64(): ShareCodeFormatError {
  return new ShareCodeFormatError('InvalidBase64', 'The share code contains characters that are not part of a share code.');
}

/**
 * Unlike .NET's DeflateStream, the browser's decompressor also rejects a deflate stream that is
 * cut short or followed by junk; both are reported as CorruptCompression here.
 */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.length;
      if (total > MAX_PAYLOAD_BYTES) {
        await reader.cancel().catch(() => {});
        throw new ShareCodeFormatError('TooLarge', 'The share code is too large.');
      }
      chunks.push(value);
    }
  } catch (e) {
    if (e instanceof ShareCodeFormatError) {
      throw e;
    }
    throw new ShareCodeFormatError('CorruptCompression', 'The share code is damaged.');
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}
