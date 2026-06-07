# Adding a framework block

Checklist for contributors shipping a new `@lessonkit/react` block with H5P parity. Copy this table into your PR description.

**Gate:** a framework block is not **done** for H5P parity until every row is checked off.

| # | Task | Where |
| --- | --- | --- |
| 1 | Set capability map **Status** to ✅ and confirm **Framework** column | [`docs/project/h5p-capability-map.md`](../../project/h5p-capability-map.md) master table |
| 2 | Add row: LessonKit id, **H5P display name**, **H5P machine name** (if known) | Capability map + [block catalog](../../reference/block-catalog.md) (v2 or v3 section) |
| 3 | Document props, `checkId` / `blockId`, a11y, telemetry, parent constraints | [Block catalog](../../reference/block-catalog.md) per-block section + [components guide](components-and-hooks.md) table |
| 4 | Add **H5P equivalent** admonition or table row on doc touchpoints | Block catalog; [H5P authors guide](../h5p-for-lessonkit-authors.md) when status changes |
| 5 | Storybook story titled with **H5P name in subtitle** (e.g. "FillInTheBlanks — H5P Fill in the Blanks") | `packages/react/stories/` |
| 6 | If scored: example `lessonkit.json` `assessments[]` entry + export parity note | Golden example or [packaging reference](../../reference/packaging.md) callout when first of kind |
| 7 | `h5pAlias` / `h5pMachineName` in **block-catalog JSON** entry | `block-catalog.v3.json` + `buildBlockCatalog()` tests |

## Implementation order

1. **Component** — `packages/react/src/blocks/` (or `components/` for shell primitives); export from `packages/react/src/index.tsx`.
2. **Catalog JSON** — add entry to `block-catalog.v3.json`; run `npm test -w @lessonkit/react` (catalog parity tests).
3. **Telemetry** — event names in `@lessonkit/core/telemetry-catalog.v3.json` if new events; xAPI mapping in `@lessonkit/xapi`.
4. **Tests** — unit tests in `packages/react/test/`; Storybook story for visual states.
5. **Docs** — complete the checklist table above.
6. **Examples** — add to a showcase example if the block is user-facing (framework-12-showcase for Tier C/D).

## Internal naming reference

Maintainers only: [`H5P_CATALOG_CROSSWALK.md`](https://github.com/eddiethedean/lessonkit/blob/main/docs/H5P_CATALOG_CROSSWALK.md) (not published in the public sidebar).

## Related

- [Contributing to the monorepo](contributing-to-the-monorepo.md)
- [Block catalog reference](../../reference/block-catalog.md)
- [ROADMAP — H5P documentation checklist](https://github.com/eddiethedean/lessonkit/blob/main/ROADMAP.md#h5p-documentation-checklist-per-block)
