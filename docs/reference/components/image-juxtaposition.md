# ImageJuxtaposition

:::{admonition} H5P equivalent
:class: tip

**H5P Image Juxtaposition**
:::

## When to use

Use `ImageJuxtaposition` for **before/after** or **A/B image comparison** with a draggable slider reveal.

## Requirements

- Provide `beforeSrc`, `afterSrc`, and alt text for both images.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-image-juxtaposition

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/image-juxtaposition"
  title="ImageJuxtaposition component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/image-juxtaposition" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-image-juxtaposition

```tsx
<ImageJuxtaposition
  blockId="workspace-jux"
  beforeSrc="/desk-cluttered.jpg"
  afterSrc="/desk-clean.jpg"
  beforeAlt="Cluttered desk with visible notes"
  afterAlt="Clean desk with locked screen"
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-image-juxtaposition

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a ImageJuxtaposition block (H5P-style: Image Juxtaposition) like this example inside the active <Lesson>:

<ImageJuxtaposition
  blockId="workspace-jux"
  beforeSrc="/desk-cluttered.jpg"
  afterSrc="/desk-clean.jpg"
  beforeAlt="Cluttered desk with visible notes"
  afterAlt="Clean desk with locked screen"
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

- [Block catalog](../block-catalog.md)
