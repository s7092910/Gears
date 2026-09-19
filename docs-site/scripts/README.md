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
| Type summaries and per-member descriptions | `///` XML doc comments in `GearsAPI/Source` |

**Nothing on the page is hand-maintained.** Everything, prose included, is parsed from
`GearsAPI/Source`, so a page can never drift from the assembly. There is no separate prose file —
document a member the same way you'd document it for IntelliSense, and the site picks it up on the
next `npm run gen:api`.

## Changing a description

Edit the `///` doc comment on the type or member in `GearsAPI/Source`, then `npm run gen:api`.
Supported tags:

```csharp
/// <summary>One line; used in frontmatter and the index tables.</summary>
/// <remarks>The paragraph under the declaration. Omit to fall back to the summary.</remarks>
/// <typeparam name="T">Only meaningful on a generic type.</typeparam>
/// <note>Rendered as a Callout.</note>
/// <reserved/>                       <!-- renders the "Reserved" warning -->
public interface IValueModSetting<T>
{
    /// <summary>Properties, events, methods, constructors and enum members all take one of these.</summary>
    T SettingValue { get; set; }
}
```

Inside any of those tags, `<see cref="IGearsMod"/>` becomes a link to that type's page (or plain
code if the name isn't a GearsAPI type — game and .NET types are never linked), `<c>text</c>` and
`<paramref name="x"/>`/`<typeparamref name="x"/>` become code spans, and literal `<`/`>` must be
escaped as `&lt;`/`&gt;` since raw angle brackets aren't legal inside XML doc comment text. A
delegate's `<param name="x">` tags go on the delegate's own declaration line. Run `gen:api:report`
if you want to see exactly which types/members currently have no `///` summary at all.

Two limits are worth knowing before you write a long comment:

- **`<remarks>` counts on a type only.** A member renders its `<summary>` and nothing else, so a
  `<remarks>` block on a property or method is parsed and then silently dropped. Put the whole member
  description in its `<summary>`, however long it runs.
- **`<para>` is not supported** and leaks into the page as literal text. Everything inside a tag is
  flattened into one paragraph, so separate ideas with sentences rather than markup.

## Adding a type to the assembly

Nothing breaks. The new type is picked up automatically, lands at the end of its namespace
section, and the report tells you what it still needs:

```
undocumented (no /// summary) (2):
  IMyNewThing (type)
  IMyNewThing#DoTheThing(String)

parser warnings (1):
  IMyNewThing is not in the settings reading order (appended at the end)
```

Add a `<summary>` to the type and place it in that section's `order` array in `lib/model.mjs`, and
regenerate.

A type in a namespace that is not in `SECTIONS` is skipped with a warning — add the namespace
there to publish it.

## Files

| File | Role |
|---|---|
| `gen-api-reference.mjs` | renders the pages, `meta.json` files and the index; undocumented-member report; `--check` |
| `lib/csharp.mjs` | the C# declaration parser (line-oriented, skips method bodies) |
| `lib/model.mjs` | namespace→section map, reading order, and all derived relationships |
| `lib/dump.mjs` | debug aid: `node scripts/lib/dump.mjs` prints everything the parser found |
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
