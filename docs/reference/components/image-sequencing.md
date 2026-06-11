# ImageSequencing

:::{admonition} H5P equivalent
:class: tip

**H5P Image Sequencing**
:::

## When to use

Use `ImageSequencing` when learners must **order images correctly** — process steps, timeline photos, or procedure screenshots.

## Requirements

- `correctOrder` is an array of image `id` values in the target sequence.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-image-sequencing

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/image-sequencing"
  title="ImageSequencing component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/image-sequencing" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-image-sequencing

```tsx
<ImageSequencing
  checkId="report-flow"
  images={[
    { id: "step-1", src: "/step-1.png", alt: "Do not click further links" },
    { id: "step-2", src: "/step-2.png", alt: "Report via mail client" },
  ]}
  correctOrder={["step-1", "step-2"]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-image-sequencing

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a ImageSequencing block (H5P-style: Image Sequencing) like this example inside the active <Lesson>:

<ImageSequencing
  checkId="report-flow"
  images={[
    { id: "step-1", src: "/step-1.png", alt: "Do not click further links" },
    { id: "step-2", src: "/step-2.png", alt: "Report via mail client" },
  ]}
  correctOrder={["step-1", "step-2"]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "procedure-seq",
  "kind": "imageSequencing",
  "question": "Order the procedure steps.",
  "correctOrder": ["step-1", "step-2"]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-image-sequencing

Add under `course.assessments[]`:

```json
{
  "checkId": "procedure-seq",
  "kind": "imageSequencing",
  "question": "Order the procedure steps.",
  "correctOrder": ["step-1", "step-2"]
}
```
:::

::::
<!-- try-it:end -->




















## See also

- [ImageSequence](image-sequence.md) — non-scored frame scrubber
