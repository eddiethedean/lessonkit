# FindMultipleHotspots

:::{admonition} H5P equivalent
:class: tip

**H5P Find Multiple Hotspots**
:::

## When to use

Use `FindMultipleHotspots` when learners must **identify every correct region** (and avoid decoys) before checking answers.

## Requirements

- `correctTargetIds` lists all required targets.
- Selecting a decoy fails the attempt even if enough correct targets were chosen.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-find-multiple-hotspots

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/find-multiple-hotspots"
  title="FindMultipleHotspots component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/find-multiple-hotspots" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-find-multiple-hotspots

```tsx
<FindMultipleHotspots
  checkId="hazard-sweep"
  src="/floor-plan.svg"
  alt="Floor plan"
  targets={[
    { id: "cable", label: "Cable trip hazard", x: 30, y: 70 },
    { id: "spill", label: "Wet floor", x: 60, y: 40 },
    { id: "clear", label: "Clear walkway", x: 20, y: 20 },
  ]}
  correctTargetIds={["cable", "spill"]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-find-multiple-hotspots

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a FindMultipleHotspots block (H5P-style: Find Multiple Hotspots) like this example inside the active <Lesson>:

<FindMultipleHotspots
  checkId="hazard-sweep"
  src="/floor-plan.svg"
  alt="Floor plan"
  targets={[
    { id: "cable", label: "Cable trip hazard", x: 30, y: 70 },
    { id: "spill", label: "Wet floor", x: 60, y: 40 },
    { id: "clear", label: "Clear walkway", x: 20, y: 20 },
  ]}
  correctTargetIds={["cable", "spill"]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "multi-hotspot",
  "kind": "findMultipleHotspots",
  "question": "Mark all hazards.",
  "src": "./images/floor-plan.svg",
  "alt": "Floor plan",
  "correctTargetIds": ["cable", "spill"]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-find-multiple-hotspots

Add under `course.assessments[]`:

```json
{
  "checkId": "multi-hotspot",
  "kind": "findMultipleHotspots",
  "question": "Mark all hazards.",
  "src": "./images/floor-plan.svg",
  "alt": "Floor plan",
  "correctTargetIds": ["cable", "spill"]
}
```
:::

::::
<!-- try-it:end -->




















## Touch behavior

Hotspot buttons reuse `lk-find-hotspot-target` (44px minimum) and the Check control uses `lk-button` when `@lessonkit/themes/base.css` is imported—same pattern as `FindHotspot`.

## See also

- [FindHotspot](find-hotspot.md)
