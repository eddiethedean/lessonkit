# ImagePairing

:::{admonition} H5P equivalent
:class: tip

**H5P Image Pairing**
:::

## When to use

Use `ImagePairing` for **memory-style image matching** — learners flip and pair cards that share the same `id`.

## Requirements

- Each `pairs` entry needs unique `id`, `label`, and `imageSrc`.
- Requires `checkId` for LMS scoring.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-image-pairing

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/image-pairing"
  title="ImagePairing component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/image-pairing" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-image-pairing

```tsx
<ImagePairing
  checkId="ppe-pairing"
  pairs={[
    { id: "helmet", label: "Hard hat", imageSrc: "/helmet.png" },
    { id: "vest", label: "High-visibility vest", imageSrc: "/vest.png" },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-image-pairing

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a ImagePairing block (H5P-style: Image Pairing) like this example inside the active <Lesson>:

<ImagePairing
  checkId="ppe-pairing"
  pairs={[
    { id: "helmet", label: "Hard hat", imageSrc: "/helmet.png" },
    { id: "vest", label: "High-visibility vest", imageSrc: "/vest.png" },
  ]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "ppe-pairing",
  "kind": "imagePairing",
  "question": "Match the PPE pairs."
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-image-pairing

Add under `course.assessments[]`:

```json
{
  "checkId": "ppe-pairing",
  "kind": "imagePairing",
  "question": "Match the PPE pairs."
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [MemoryGame](memory-game.md) — text labels without images
