# ImageSequence

:::{admonition} H5P equivalent
:class: tip

**H5P Image Sequencing (frames)**
:::

## When to use

Use `ImageSequence` for **step-by-step visuals** controlled by a slider — assembly instructions, frame-by-frame diagrams.

Not scored; use [`ImageSequencing`](image-sequencing.md) when order must be assessed.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-image-sequence

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/image-sequence"
  title="ImageSequence component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/image-sequence" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-image-sequence

```tsx
<ImageSequence
  blockId="incident-steps"
  frames={[
    { src: "/contain.png", alt: "Contain", label: "Contain" },
    { src: "/report.png", alt: "Report", label: "Report" },
    { src: "/document.png", alt: "Document", label: "Document" },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-image-sequence

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a ImageSequence block (H5P-style: Image Sequencing (frames)) like this example inside the active <Lesson>:

<ImageSequence
  blockId="incident-steps"
  frames={[
    { src: "/contain.png", alt: "Contain", label: "Contain" },
    { src: "/report.png", alt: "Report", label: "Report" },
    { src: "/document.png", alt: "Document", label: "Document" },
  ]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

::::
<!-- try-it:end -->




















## See also

- [ImageSequencing](image-sequencing.md)
