# Image

:::{admonition} H5P equivalent
:class: tip

**H5P Image**
:::

## When to use

Use `Image` for **illustrations, diagrams, or photos** with required alt text. Prefer relative or HTTPS URLs allowed by your media policy.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-image

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/image"
  title="Image component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/image" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-image

```tsx
<Text blockId="caption">Labeled floor plans help learners locate exits and restricted zones.</Text>
<Image blockId="floor-image" src="/floor-plan.svg" alt="Office floor plan with exits marked" />
```
:::

:::{tab-item} AI prompt
:sync: component-image

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Image block (H5P-style: Image) like this example inside the active <Lesson>:

<Text blockId="caption">Labeled floor plans help learners locate exits and restricted zones.</Text>
<Image blockId="floor-image" src="/floor-plan.svg" alt="Office floor plan with exits marked" />

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

- [ImageHotspots](image-hotspots.md) — clickable regions on an image
