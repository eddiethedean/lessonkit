# ImageHotspots

:::{admonition} H5P equivalent
:class: tip

**H5P Image Hotspots**
:::

## When to use

Use `ImageHotspots` when learners **explore regions of an image** — floor plans, equipment diagrams, or UI callouts. Each hotspot opens associated content.

## Requirements

- `x` and `y` are percentages (0–100) from the top-left of the image.
- Provide meaningful `label` text for buttons.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-image-hotspots

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/image-hotspots"
  title="ImageHotspots component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/image-hotspots" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-image-hotspots

```tsx
<ImageHotspots
  blockId="floor-hotspots"
  src="/floor-plan.svg"
  alt="Office floor plan"
  hotspots={[
    { id: "exit", label: "Emergency exit", x: 80, y: 20, content: <Text>Keep aisles clear.</Text> },
    { id: "desk", label: "Workstation", x: 40, y: 50, content: <Text>Lock your screen when away.</Text> },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-image-hotspots

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a ImageHotspots block (H5P-style: Image Hotspots) like this example inside the active <Lesson>:

<ImageHotspots
  blockId="floor-hotspots"
  src="/floor-plan.svg"
  alt="Office floor plan"
  hotspots={[
    { id: "exit", label: "Emergency exit", x: 80, y: 20, content: <Text>Keep aisles clear.</Text> },
    { id: "desk", label: "Workstation", x: 40, y: 50, content: <Text>Lock your screen when away.</Text> },
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

- [FindHotspot](../block-catalog.md) — scored hotspot assessments
