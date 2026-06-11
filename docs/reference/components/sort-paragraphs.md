# SortParagraphs

:::{admonition} H5P equivalent
:class: tip

**H5P Sort the Paragraphs**
:::

## When to use

Use `SortParagraphs` for **ordering paragraphs** into the correct sequence. Learners rearrange text blocks; scoring compares their order to `correctOrder`.

Set `kind: "sortParagraphs"` in `lessonkit.json` when packaging.

## Requirements

- Requires `checkId` inside `Lesson`.
- Props and telemetry: [block catalog — SortParagraphs](../block-catalog.md).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-sort-paragraphs

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/sort-paragraphs"
  title="SortParagraphs component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/sort-paragraphs" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-sort-paragraphs

```tsx
<SortParagraphs
  checkId="ir-sort"
  paragraphs={["Contain the account", "Notify security", "Document the timeline"]}
  correctOrder={[0, 1, 2]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-sort-paragraphs

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a SortParagraphs block (H5P-style: Sort the Paragraphs) like this example inside the active <Lesson>:

<SortParagraphs
  checkId="ir-sort"
  paragraphs={["Contain the account", "Notify security", "Document the timeline"]}
  correctOrder={[0, 1, 2]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "ir-sort",
  "kind": "sortParagraphs",
  "question": "Order the incident response steps",
  "paragraphs": ["Contain the account", "Notify security", "Document the timeline"],
  "correctOrder": [0, 1, 2]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-sort-paragraphs

SPA-only in LMS shell (`kind: "sortParagraphs"`). Omit from `assessments[]` when packaging SCORM/xAPI/cmi5 if you rely on shell scoring only.

```json
{
  "checkId": "ir-sort",
  "kind": "sortParagraphs",
  "question": "Order the incident response steps",
  "paragraphs": ["Contain the account", "Notify security", "Document the timeline"],
  "correctOrder": [0, 1, 2]
}
```
:::

::::
<!-- try-it:end -->



## `correctOrder` indices

`paragraphs` is the source list. `correctOrder` lists **zero-based indices** in the target sequence — not the text itself. The Try it example uses `[0, 1, 2]` when paragraphs should stay in source order.

Reorder steps by permuting indices:

```tsx
<SortParagraphs
  checkId="onboarding-sort"
  paragraphs={["Complete training", "Request badge access", "Attend orientation"]}
  correctOrder={[2, 0, 1]}
/>
```

Learners drag list items (or use move buttons) until the order matches `correctOrder`, then click **Check**. Scoring is all-or-nothing on the full sequence.

## Touch behavior

Use **Up** / **Down** buttons to reorder paragraphs (44px minimum with `@lessonkit/themes/base.css`). No drag-to-reorder — optimized for touch and keyboard.

## Packaging

Add `kind: "sortParagraphs"` under `course.assessments[]` for SPA validation. Omit from `assessments[]` when packaging SCORM/xAPI/cmi5 if you rely on shell scoring only — see [Migration 1.6 → 1.7](../../MIGRATION-1.6-to-1.7.md).

## See also

- [ImageSequencing](image-sequencing.md) — image-based ordering
- [Block catalog — SortParagraphs](../block-catalog.md)
- [Block cookbook — SortParagraphs](../../guides/react-developers/block-cookbook.md#sortparagraphs)
- [Assessment showcase](../../examples/index.md#assessment-showcase-examplesassessments-p0)

