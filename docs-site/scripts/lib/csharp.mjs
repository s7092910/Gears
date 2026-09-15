/**
 * A small C# declaration parser, scoped to what GearsAPI actually uses: block-scoped
 * namespaces, interfaces, classes, enums, delegates, and their members.
 *
 * Deliberately not a general C# parser. It reads declarations and skips method bodies; it never
 * looks at expressions. That is enough to derive every signature in the public API surface.
 * It is line-oriented, which the GearsAPI sources support because they are uniformly formatted
 * with one declaration per line.
 */

const ACCESS = ['public', 'private', 'protected', 'internal'];
const OTHER_MODS = [
  'static', 'abstract', 'sealed', 'virtual', 'override', 'partial',
  'readonly', 'const', 'extern', 'new', 'async', 'unsafe', 'event',
];

const PRIMITIVE_LABEL = {
  string: 'String', int: 'Int32', bool: 'Boolean', float: 'Single', double: 'Double',
  long: 'Int64', short: 'Int16', byte: 'Byte', char: 'Char', object: 'Object',
  uint: 'UInt32', ulong: 'UInt64', decimal: 'Decimal', sbyte: 'SByte', ushort: 'UInt16',
};

/** Parameter type as the .NET API browser writes it: `string` -> `String`. */
export function typeLabel(t) {
  const trimmed = String(t).trim();
  const arr = trimmed.match(/^(.*?)(\[\])$/);
  if (arr) return typeLabel(arr[1]) + '[]';
  return PRIMITIVE_LABEL[trimmed] ?? trimmed;
}

/** `IFoo<T>` -> { base: 'IFoo', args: ['T'] } */
export function splitGeneric(name) {
  const s = String(name).trim();
  const lt = s.indexOf('<');
  if (lt < 0 || !s.endsWith('>')) return { base: s, args: [] };
  return { base: s.slice(0, lt).trim(), args: splitTopLevel(s.slice(lt + 1, -1)) };
}

/** Split a comma list, ignoring commas nested inside <>, () or []. */
export function splitTopLevel(s, sep = ',') {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const c of String(s)) {
    if (c === '<' || c === '(' || c === '[') depth++;
    else if (c === '>' || c === ')' || c === ']') depth--;
    if (c === sep && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Index of the base-list `:`, ignoring generic arguments. */
function baseColon(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '<' || c === '(') depth++;
    else if (c === '>' || c === ')') depth--;
    else if (c === ':' && depth === 0) return i;
  }
  return -1;
}

function splitModifiers(decl) {
  const words = decl.trim().split(/\s+/);
  const mods = [];
  let i = 0;
  while (i < words.length && (ACCESS.includes(words[i]) || OTHER_MODS.includes(words[i]))) {
    mods.push(words[i]);
    i++;
  }
  return { mods, rest: words.slice(i).join(' ') };
}

function parseParams(inside) {
  if (!inside || !inside.trim()) return [];
  return splitTopLevel(inside).map((p) => {
    const s = p.replace(/^(ref|out|in|params|this)\s+/, '').replace(/=[\s\S]*$/, '').trim();
    const parts = s.split(/\s+/);
    const name = parts.pop();
    return { type: parts.join(' '), name };
  });
}

/** Strip `//` comments, keep `///` docs, leave string/char literals intact. */
function preprocess(source) {
  const rows = [];
  for (const raw of source.split(/\r?\n/)) {
    let code = '';
    let doc = null;
    let inStr = false;
    let inChr = false;
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      const n = raw[i + 1];
      if (inStr) { code += c; if (c === '\\') { code += n ?? ''; i++; } else if (c === '"') inStr = false; continue; }
      if (inChr) { code += c; if (c === '\\') { code += n ?? ''; i++; } else if (c === "'") inChr = false; continue; }
      if (c === '"') { inStr = true; code += c; continue; }
      if (c === "'") { inChr = true; code += c; continue; }
      if (c === '/' && n === '/') { if (raw[i + 2] === '/') doc = raw.slice(i + 3).trim(); break; }
      code += c;
    }
    rows.push({ code: code.trim(), doc });
  }
  return rows;
}

/** Pull `<summary>` out of a `///` block, flattened to one line. */
function docSummary(lines) {
  if (!lines || !lines.length) return null;
  const joined = lines.join('\n');
  const m = joined.match(/<summary>([\s\S]*?)<\/summary>/);
  const body = (m ? m[1] : joined)
    .replace(/<see\s+cref="[A-Za-z]:?([^"]+)"\s*\/>/gi, '$1')
    .replace(/<paramref\s+name="([^"]+)"\s*\/>/gi, '$1')
    .replace(/<\/?(c|para|remarks|summary|returns|value)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return body.split('\n').map((l) => l.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || null;
}

const countChar = (s, ch) => {
  let n = 0;
  let inStr = false;
  let inChr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (inChr) { if (c === '\\') i++; else if (c === "'") inChr = false; continue; }
    if (c === '"') { inStr = true; continue; }
    if (c === "'") { inChr = true; continue; }
    if (c === ch) n++;
  }
  return n;
};

/**
 * Parse one file. Returns a list of namespaces, each with a flat list of types (nested types
 * appear both under their parent's `nested` and in the namespace list).
 */
export function parseFile(source, file) {
  const rows = preprocess(source);
  const namespaces = [];
  const scopes = []; // { kind: 'namespace'|'type'|'block', node, depth }

  let docBuf = [];
  let attrBuf = [];
  let pending = '';   // declaration text accumulated across lines
  let depth = 0;      // net brace depth
  let skipUntil = null; // inside a method/property body: ignore everything until depth drops here

  const curType = () => [...scopes].reverse().find((s) => s.kind === 'type')?.node ?? null;
  const curNs = () => [...scopes].reverse().find((s) => s.kind === 'namespace')?.node ?? null;
  const popTo = () => { while (scopes.length && scopes[scopes.length - 1].depth > depth) scopes.pop(); };

  for (const row of rows) {
    if (row.doc !== null) { docBuf.push(row.doc); continue; }
    if (!row.code) continue;
    const text = row.code;

    // Inside a body we only care about getting back out of it.
    if (skipUntil !== null) {
      depth += countChar(text, '{') - countChar(text, '}');
      if (depth <= skipUntil) { skipUntil = null; popTo(); }
      continue;
    }

    // Closing brace(s) only. Flush any pending text first: enum members have no terminator,
    // so the last entry is still sitting in `pending` when the body closes.
    if (/^[}\s;,]+$/.test(text)) {
      if (pending.trim()) { handleMember(pending, docBuf, attrBuf); pending = ''; docBuf = []; attrBuf = []; }
      depth -= countChar(text, '}');
      popTo();
      continue;
    }

    // attribute line(s)
    if (/^\[/.test(text) && /\]$/.test(text) && !pending) { attrBuf.push(text); continue; }

    pending = pending ? `${pending} ${text}` : text;

    const opens = countChar(pending, '{');
    const closes = countChar(pending, '}');

    // No brace yet and no terminator: an unfinished header, keep reading.
    if (opens === 0 && !/;$/.test(pending)) continue;

    const decl = pending;
    const doc = docBuf;
    const attrs = attrBuf;
    pending = ''; docBuf = []; attrBuf = [];

    if (opens > 0 && opens === closes) {
      // Self-contained: `Type X { get; }`, or a ctor/method with an inline `{ }` body.
      if (isScopeOpener(decl)) { openScope(decl, doc, attrs); scopes.pop(); }
      else handleMember(decl, doc, attrs, true);
      continue;
    }

    if (opens > closes) {
      depth += opens - closes;
      if (isScopeOpener(decl)) {
        openScope(decl, doc, attrs);
        scopes[scopes.length - 1].depth = depth;
      } else {
        // A member whose body follows: record the member, then skip the body.
        handleMember(decl, doc, attrs, true);
        skipUntil = depth - 1;
      }
      continue;
    }

    handleMember(decl, doc, attrs, false);
  }

  function isScopeOpener(decl) {
    const head = decl.split('{')[0];
    if (/^namespace\s/.test(head.trim())) return true;
    const { rest } = splitModifiers(head);
    return /^(class|interface|enum|struct)\s/.test(rest);
  }

  function openScope(decl, doc, attrs) {
    const head = decl.split('{')[0].trim();

    const ns = head.match(/^namespace\s+([\w.]+)$/);
    if (ns) {
      let node = namespaces.find((n) => n.name === ns[1]);
      if (!node) { node = { name: ns[1], types: [] }; namespaces.push(node); }
      scopes.push({ kind: 'namespace', node, depth });
      return;
    }

    const { mods, rest } = splitModifiers(head);
    const m = rest.match(/^(class|interface|enum|struct)\s+(.+)$/);
    if (!m) { scopes.push({ kind: 'block', node: null, depth }); return; }

    let tail = m[2].trim();
    let constraints = '';
    const wi = tail.search(/\bwhere\b/);
    if (wi >= 0) { constraints = tail.slice(wi).trim(); tail = tail.slice(0, wi).trim(); }
    let bases = [];
    const ci = baseColon(tail);
    if (ci >= 0) { bases = splitTopLevel(tail.slice(ci + 1)); tail = tail.slice(0, ci).trim(); }
    const g = splitGeneric(tail);

    const parent = curType();
    const node = {
      kind: m[1],
      name: g.base,
      typeParams: g.args,
      bases,
      constraints,
      modifiers: mods,
      attributes: attrs,
      doc: docSummary(doc),
      file,
      declaringType: parent ? parent.name : null,
      members: [],
      nested: [],
    };
    if (parent) parent.nested.push(node);
    curNs()?.types.push(node);
    scopes.push({ kind: 'type', node, depth });
  }

  function handleMember(decl, doc, attrs, hasBody = false) {
    const t = curType();
    const clean = decl.replace(/;$/, '').trim();

    // delegate (namespace level or nested)
    if (/\bdelegate\b/.test(clean)) {
      const { mods } = splitModifiers(clean);
      const after = clean.replace(/^[\s\S]*?\bdelegate\s+/, '');
      const paren = after.indexOf('(');
      const close = matchParen(after, paren);
      const before = after.slice(0, paren).trim();
      const words = before.split(/\s+/);
      const nameG = words.pop();
      const g = splitGeneric(nameG);
      const node = {
        kind: 'delegate',
        name: g.base,
        typeParams: g.args,
        returnType: words.join(' '),
        params: parseParams(after.slice(paren + 1, close)),
        bases: [],
        constraints: '',
        modifiers: mods,
        attributes: attrs,
        doc: docSummary(doc),
        file,
        declaringType: t ? t.name : null,
        signature: `${clean};`,
        members: [],
        nested: [],
      };
      if (t) t.nested.push(node);
      curNs()?.types.push(node);
      return;
    }

    if (!t) return;

    if (t.kind === 'enum') {
      for (const entry of splitTopLevel(clean.replace(/[{}]/g, ''))) {
        const em = entry.match(/^([A-Za-z_]\w*)\s*(?:=\s*(.+))?$/);
        if (!em) continue;
        t.members.push({
          kind: 'enumField',
          name: em[1],
          value: em[2] ? em[2].trim() : String(t.members.length),
          signature: entry.trim(),
          modifiers: [],
          params: [],
          doc: docSummary(doc),
        });
      }
      return;
    }

    // property: has an accessor block
    if (/\{/.test(clean)) {
      const head = clean.slice(0, clean.indexOf('{')).trim();
      const body = clean.slice(clean.indexOf('{'));
      const { mods, rest } = splitModifiers(head);
      if (!/[()]/.test(head)) {
        const pm = rest.match(/^(.+?)\s+([A-Za-z_]\w*)$/);
        if (pm) {
          const accessors = [...body.matchAll(/\b(get|set|init)\b/g)].map((x) => x[1]);
          t.members.push({
            kind: 'property',
            name: pm[2],
            propertyType: pm[1].trim(),
            accessors: [...new Set(accessors)],
            signature: `${head} { ${[...new Set(accessors)].map((a) => a + ';').join(' ')} }`,
            modifiers: mods,
            params: [],
            doc: docSummary(doc),
          });
          return;
        }
      }
      // method or constructor with an inline body
      const m = matchCallable(head, t, mods, attrs, doc, true);
      if (m) { t.members.push(m); return; }
      return;
    }

    // event
    if (/\bevent\b/.test(clean)) {
      const { mods } = splitModifiers(clean);
      const after = clean.replace(/^[\s\S]*?\bevent\s+/, '');
      const words = after.split(/\s+/);
      const name = words.pop();
      t.members.push({
        kind: 'event',
        name,
        eventType: words.join(' '),
        signature: `${clean};`,
        modifiers: mods,
        params: [],
        doc: docSummary(doc),
      });
      return;
    }

    // method / constructor without a body
    if (/\(/.test(clean)) {
      const { mods } = splitModifiers(clean);
      const m = matchCallable(clean, t, mods, attrs, doc, hasBody);
      if (m) { t.members.push(m); return; }
    }

    // field
    const { mods, rest } = splitModifiers(clean);
    const f = rest.match(/^(.+)\s+([A-Za-z_]\w*)$/);
    if (f) {
      t.members.push({
        kind: 'field',
        name: f[2],
        fieldType: f[1].trim(),
        signature: `${clean};`,
        modifiers: mods,
        params: [],
        doc: docSummary(doc),
      });
    }
  }

  function matchCallable(text, type, mods, attrs, doc, hasBody = false) {
    const paren = text.indexOf('(');
    if (paren < 0) return null;
    const close = matchParen(text, paren);
    if (close < 0) return null;

    const head = text.slice(0, paren).trim();
    const inside = text.slice(paren + 1, close);
    let tail = text.slice(close + 1).trim();
    tail = tail.replace(/^:\s*(base|this)\s*\([^)]*\)/, '').trim();
    let constraints = '';
    const wi = tail.search(/\bwhere\b/);
    if (wi >= 0) constraints = tail.slice(wi).replace(/\{[\s\S]*$/, '').trim();

    const { rest } = splitModifiers(head);
    if (!rest) return null;
    const words = rest.split(/\s+/);
    const nameG = words.pop();
    const returnType = words.join(' ');
    const g = splitGeneric(nameG);
    if (!/^[A-Za-z_]\w*$/.test(g.base)) return null;

    const isCtor = !returnType && g.base === type.name;
    if (!isCtor && !returnType) return null;

    const parts = [
      ...mods,
      returnType,
      `${g.base}${g.args.length ? `<${g.args.join(', ')}>` : ''}(${inside.trim()})`,
    ].filter(Boolean);
    let signature = parts.join(' ');
    if (constraints) signature += ` ${constraints}`;
    // A member declared with a body is not a declaration statement, so no trailing `;`.
    if (!isCtor && !hasBody) signature += ';';

    return {
      kind: isCtor ? 'constructor' : 'method',
      hasBody,
      name: g.base,
      typeParams: g.args,
      returnType: returnType || null,
      params: parseParams(inside),
      constraints,
      signature,
      modifiers: mods,
      attributes: attrs,
      doc: docSummary(doc),
    };
  }

  function matchParen(s, open) {
    if (open < 0) return -1;
    let d = 0;
    for (let i = open; i < s.length; i++) {
      if (s[i] === '(') d++;
      else if (s[i] === ')') { d--; if (d === 0) return i; }
    }
    return -1;
  }

  return namespaces;
}

/** Stable key for prose lookup, matching the .NET API browser's member naming. */
export function memberKey(m) {
  if (m.kind === 'method' || m.kind === 'constructor') {
    const g = m.typeParams?.length ? `<${m.typeParams.join(', ')}>` : '';
    return `${m.name}${g}(${m.params.map((p) => typeLabel(p.type)).join(', ')})`;
  }
  return m.name;
}
