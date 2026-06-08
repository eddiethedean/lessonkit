# Collage

:::{admonition} H5P equivalent
:class: tip

**H5P Collage**
:::

## When to use

Use `Collage` for **multi-image grids** with optional captions — mood boards, team photos, or panel comparisons.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-collage

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/collage"
  title="Collage component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/collage" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-collage

```tsx
<Collage
  blockId="ops-overview"
  columns={2}
  cells={[
    { id: "map", src: "/assembly-map.svg", alt: "Assembly points", caption: "Assembly points" },
    { id: "team", src: "/wardens.jpg", alt: "Floor wardens", caption: "Floor wardens" },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-collage

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Collage block (H5P-style: Collage) like this example inside the active <Lesson>:

<Collage
  blockId="ops-overview"
  columns={2}
  cells={[
    { id: "map", src: "/assembly-map.svg", alt: "Assembly points", caption: "Assembly points" },
    { id: "team", src: "/wardens.jpg", alt: "Floor wardens", caption: "Floor wardens" },
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

- [Image](image.md)
