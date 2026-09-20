# Gears content guide

Use this guide for every user-facing documentation change. It applies to the documentation pages, landing page, generated API reference, and published images.

Gears' readers are mod developers for the video game 7 Days to Die who need to install, evaluate, integrate, operate, or debug the Gears' mod with their own mods. Help them complete those tasks. Do not assume they know Gears' architecture or internal vocabulary.

Follow the [Mailchimp voice and tone guide](https://styleguide.mailchimp.com/voice-and-tone/): be plainspoken, helpful, and clear. Prefer useful information over personality or promotion.

## Write for the reader's task

State what the reader can do, then tell them how to do it.

- Start a page with its purpose or the first action.
- Phrase procedures as instructions.
- Put prerequisites before the steps that require them.
- Explain the result of a feature or choice when it is not obvious.
- Separate concepts, procedures, reference material, and troubleshooting when mixing them would make a page harder to scan.

## Use plain English

- Use active voice and direct verbs.
- Address the reader as “you” when it makes an instruction clearer.
- Keep sentences focused on one idea.
- Keep paragraphs short. Split a paragraph when it changes topic or exceeds about four sentences.
- Use a list or table only when it makes repeated information easier to compare.
- Use American English in prose. Keep API identifiers exactly as written in code.
- Use humor sparingly. Never let it obscure instructions, errors, limitations, or security guidance.

Avoid marketing claims, filler, idioms, and internal shorthand. Words such as “powerful,” “seamless,” “effortless,” “magic,” “hot path,” “front door,” and “pre-warm” rarely help the reader. Describe the behavior instead.

## Define terms before using them

Define a Gears-specific term the first time it appears on a page. Link to the fuller concept page when that would help.

Use these meanings consistently:

| Term | Meaning |
| --- | --- |
| **mod setting** | Settings for a mod that is defined by GearsAPI |
| **world setting** | Settings for a mod that defined for a given world, cannot be changed while a world is running |
| **global setting** | Settings for a mod that is defined globally. It can be changed by the user in the main menu or the in game menu |

Expand an acronym on first use, for example “round-trip time (RTT)” or “remote procedure call (RPC).” Do not use another product's acronym as the only explanation of a Gears feature.

Use `setting` in prose. Use `IModSettings` and other British-spelled identifiers exactly as the API defines them.

## Describe current behavior

Treat the current implementation and generated API reference as the source of truth. Before documenting a feature:

1. Check the relevant guide and generated reference page.
2. Check the current public API.
3. Check the implementation when behavior or limits remain unclear.
4. Update the source comment when generated documentation is wrong.

Document what Gears does now. Do not present a design idea, roadmap item, or old demo behavior as an available feature. Label a limitation directly instead of implying that the software handles it. 

Important current boundaries include:

- Only document modder facing features, ie the GearsAPI and how Gears uses the GearsAPI. Do not document the internals of Gears.

Recheck these statements against the code before repeating them. Change this guide when the implementation changes.

## Keep examples public and self-contained

Use generic names that explain the role of an example, such as:

- `PlayerInput`
- `PlayerController`
- `ExampleGameMode`
- `Projectile`
- `interior#…`
- `my-mod`

Do not refer to private demo projects, their classes, or settings.

Make code examples internally consistent:

- Define every non-obvious type, field, constant, and message ID used by the example, or link to where it is defined.
- Use the same names in prose and code.
- Show the required component, attribute, or registration step.
- Do not imply that sample bot, NPC, spawning, or game-mode behavior comes with Gears.
- Use placeholders such as `<setting>` only when the reader must replace them. Explain what value belongs there.

## Structure pages for scanning

- Give every MDX page a specific `title` and `description` in frontmatter.
- Use an imperative title for a task page, such as "Getting Started." or "How to Create World Settings"
- Use descriptive headings that make sense outside the page's table of contents.
- Put the most common path first. Move edge cases and implementation detail later.
- Use callouts for security risks, data loss, irreversible operations, and easy-to-miss constraints—not ordinary tips.
- Use absolute documentation paths, such as `/docs/getting-started`.
- Use meaningful link text. Prefer `[Getting Started](/docs/getting-started)` over `[/docs/getting-started](...)` or “click here.”
- Escape `<`, `>`, `{`, and `}` in MDX prose or wrap the value in backticks.

Keep reference material complete but concise. A guide should explain how to choose and use an API. The generated reference should document its exact signatures, fields, and behavior.

## Add images and animations

Store every image in `docs-site/public/images/` and name it in kebab case, such as
`Color-Setting.png`. Reference it with a root-absolute markdown image:

```md
![A color setting in the mod's settings page](/images/Color-Setting.png)
```

- Never write the `/Gears` base path yourself, and never use a relative path such as
  `](images/…)`. The build adds the base path and the image's dimensions for you, and
  `npm run check` fails on both mistakes and on a file that is missing from `public/`.
- Animated GIFs work. The site is a static export with image optimization turned off, so the file is
  served as it is and the animation survives.
- Keep a file in the same size range as the screenshots already in `public/images/`. Every image
  ships in the repository and in the published site.
- Do not use a `<video>` tag. The base path is not applied to it, so it fails on the published site.
- Write alt text that says what the reader should see, and keep any wording that matters in the
  prose. A GIF plays with no pause control, and no one can search or translate the text inside it.

## Update generated documentation at its source

Do not edit these directories by hand:

- `docs-site/content/docs/reference/`

To change API documentation, edit public XML comments under `GearsAPI/Source`, or update `docs-site/scripts/lib/csharp.mjs` when the shared reference format must change.

From `/docs-site`, regenerate references with:

```bash
npm run gen:api
```

Commit the generated output with its source changes.

## Review checklist

Before finishing a documentation change, check that:

- The page addresses a game developer's task or question.
- The first paragraph states the purpose or first action.
- Every Gears-specific term and acronym is defined before use.
- Instructions use direct, active language.
- Paragraphs and sentences are short enough to scan.
- Examples use generic public names and define their dependencies.
- Claims match the current API and implementation.
- Limitations, security concerns, and destructive effects are explicit.
- No text or image exposes private demo data outside a recorded exception.
- Generated pages were changed at their source and regenerated.
- Internal links point to an existing route and heading.

## Verify the site

From `/docs-site`, run:

```bash
npm run gen:api
npm run check
npm run build
```

Search the repository for known private demo identifiers. Include source comments because they feed generated pages.

If a verification command fails for an unrelated repository issue, report the exact failure. Do not claim that the documentation passed that check.