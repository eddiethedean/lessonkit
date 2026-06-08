# ImageSlider

:::{admonition} H5P equivalent
:class: tip

**H5P Image Slider**
:::

## When to use

Use `ImageSlider` for **photo galleries** — before/after sets, product shots, or exhibit walkthroughs with prev/next controls.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-image-slider

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/image-slider"
  title="ImageSlider component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/image-slider" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-image-slider

```tsx
<ImageSlider
  blockId="desk-compare"
  slides={[
    { src: "/desk-before.jpg", alt: "Cluttered desk", caption: "Before — violations" },
    { src: "/desk-after.jpg", alt: "Clean desk", caption: "After — compliant" },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-image-slider

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a ImageSlider block (H5P-style: Image Slider) like this example inside the active <Lesson>:

<ImageSlider
  blockId="desk-compare"
  slides={[
    { src: "/desk-before.jpg", alt: "Cluttered desk", caption: "Before — violations" },
    { src: "/desk-after.jpg", alt: "Clean desk", caption: "After — compliant" },
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

- [ImageSequence](image-sequence.md) — scrubber without prev/next chrome
