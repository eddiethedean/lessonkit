# FindHotspot

:::{admonition} H5P equivalent
:class: tip

**H5P Find the Hotspot**
:::

## When to use

Use `FindHotspot` when learners must **pick one correct region** on an image — locate a single hazard, control, or UI element. The **Check** action stays pinned to the bottom of the image so it remains visible after selecting a target.

## Requirements

- `targets` use percentage `x`/`y` positions.
- `correctTargetId` must match one target `id`.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-find-hotspot

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/find-hotspot"
  title="FindHotspot component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/find-hotspot" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-find-hotspot

```tsx
<FindHotspot
  checkId="egress-check"
  src="/floor-plan.svg"
  alt="Floor plan"
  targets={[
    { id: "hazard", label: "Blocked aisle", x: 45, y: 60 },
    { id: "exit", label: "Clear exit", x: 80, y: 20 },
  ]}
  correctTargetId="hazard"
/>
```
:::

:::{tab-item} AI prompt
:sync: component-find-hotspot

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a FindHotspot block (H5P-style: Find the Hotspot) like this example inside the active <Lesson>:

<FindHotspot
  checkId="egress-check"
  src="/floor-plan.svg"
  alt="Floor plan"
  targets={[
    { id: "hazard", label: "Blocked aisle", x: 45, y: 60 },
    { id: "exit", label: "Clear exit", x: 80, y: 20 },
  ]}
  correctTargetId="hazard"
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "hazard-hotspot",
  "kind": "findHotspot",
  "question": "Locate the blocked aisle.",
  "src": "./images/floor-plan.svg",
  "alt": "Floor plan",
  "correctTargetId": "hazard"
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-find-hotspot

Add under `course.assessments[]`:

```json
{
  "checkId": "hazard-hotspot",
  "kind": "findHotspot",
  "question": "Locate the blocked aisle.",
  "src": "./images/floor-plan.svg",
  "alt": "Floor plan",
  "correctTargetId": "hazard"
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [FindMultipleHotspots](find-multiple-hotspots.md)
- [ImageHotspots](image-hotspots.md) — non-scored exploration
