@AGENTS.md

# Documentation changes follow CONTENT_GUIDE.md

`docs-site/CONTENT_GUIDE.md` governs every user-facing documentation change: the pages under
`content/docs/`, the landing page in `app/(home)/`, the generated API reference, the images in
`public/images/`, and the XML comments under `GearsAPI/Source` that the reference is generated from.

Read it before writing or editing any of those, and follow it — voice and tone, the terms table, the
rule that the current implementation is the source of truth, the example rules, page structure, and
the image rules. Finish with its Review checklist.

Never hand-edit `content/docs/reference/`. Change the XML comments under `GearsAPI/Source`, then run
`npm run gen:api` and commit the generated output with the source change.

Verify from `/docs-site` before calling a documentation change done:

```bash
npm run gen:api
npm run check
npm run build
```
