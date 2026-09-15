# API reference generator

`content/docs/reference/**` is **generated**. Do not hand-edit those `.mdx` files — the next run
overwrites them. CI fails the build if they are stale.

```bash
npm run gen:api          # regenerate the reference pages
npm run gen:api:report   # only print the drift report, write nothing
npm run gen:api:check    # fail if the pages are stale (used by CI)
npm run check            # gen:api:check + check:links
```

## Where each piece of a page comes from

| Part of the page | Source |
|---|---|
| Declaration, member signatures, parameter names and types, generic constraints, attributes | parsed from `GearsAPI/Source/**/*.cs` |
| Kind label (Interface / Sealed class / …) | derived from the declaration's modifiers |
| `Implements` (transitive), `Derived` (direct), `Inheritance` chain, `Nested types` | derived from the base lists across the whole assembly |
| Enum member values | read from source, including implicit `0, 1, 2…` |
| URL slug, section folder, sidebar order | derived from the type name and `SECTIONS` in `lib/model.mjs` |
| Type summaries and per-member descriptions | `api-prose.json`, falling back to `///` XML doc comments |

The split matters: **nothing structural is hand-maintained**, so a signature on the site cannot
drift from the assembly. Prose is hand-written because the XML doc comments in `GearsAPI/Source`
are too sparse to carry a reference (11 of 36 files have any at all).

## Changing a description

Edit `api-prose.json`, then `npm run gen:api`. Keys are:

```jsonc
{
  "IValueModSetting<T>": {            // type key: name plus generic parameters
    "summary": "…",                   // one line; used in frontmatter and the index tables
    "description": "…",               // the paragraph under the declaration
    "typeParams": "`T` — …",          // optional, only for generic types
    "note": "…",                      // optional, rendered as a Callout
    "reserved": true,                 // optional, renders the "Reserved" warning
    "members": {
      "SettingValue": "…",            // properties, events, enum members: bare name
      "AddPreview(T, String)": "…",   // methods/constructors: name + .NET-style parameter types
      "param:setting": "…"            // delegate parameters
    }
  }
}
```

Member keys use the .NET API browser convention — `string` is `String`, `int` is `Int32`, and
overloads are distinguished by their parameter list (`CreateTab(String)` vs
`CreateTab(String, String)`). Run `gen:api:report` if you are unsure of a key; it prints the exact
one for anything missing.

## Adding a type to the assembly

Nothing breaks. The new type is picked up automatically, lands at the end of its namespace
section, and the report tells you what it still needs:

```
source has it, prose does not (2):
  IMyNewThing (description)
  IMyNewThing#DoTheThing(String)

parser warnings (1):
  IMyNewThing is not in the settings reading order (appended at the end)
```

Add a `summary` and `description` to `api-prose.json`, place the type in that section's `order`
array in `lib/model.mjs`, and regenerate. A member that has a `///` summary needs no prose entry.

A type in a namespace that is not in `SECTIONS` is skipped with a warning — add the namespace
there to publish it.

## Files

| File | Role |
|---|---|
| `gen-api-reference.mjs` | renders the pages, `meta.json` files and the index; drift report; `--check` |
| `lib/csharp.mjs` | the C# declaration parser (line-oriented, skips method bodies) |
| `lib/model.mjs` | namespace→section map, reading order, and all derived relationships |
| `lib/dump.mjs` | debug aid: `node scripts/lib/dump.mjs` prints everything the parser found |
| `api-prose.json` | the hand-written prose |
| `check-links.mjs` | audits every internal doc link and heading anchor |
| `check-subpath.mjs` | verifies the export works under `/Gears/`, as GitHub Pages serves it |

### Checking the export the way Pages serves it

`npm start` serves `out/` from the root, which **cannot** reproduce a `basePath` mistake — the
usual way a project-site deploy ships broken. Stage it one level down instead:

```bash
npm run build
mkdir -p ../.preview && rm -rf ../.preview/Gears && cp -r out ../.preview/Gears
npx serve ../.preview -l 4321      # then, in another shell:
node scripts/check-subpath.mjs
```

## Parser scope

`lib/csharp.mjs` handles what GearsAPI uses: block-scoped namespaces, interfaces, classes, enums,
delegates, nested types, generic constraints, attributes, and XML doc comments. It is **not** a
general C# parser — it reads declarations and skips bodies. Things it does not attempt: file-scoped
namespaces, expression-bodied members, tuples, records, partial types spread across files.
`npm run gen:api:report` surfacing a type you expected to see is the signal that the parser needs
extending; `lib/dump.mjs` shows exactly what it did read.
