# MapExit

:::{admonition} H5P equivalent
:class: tip

**H5P Game Map (exit)**
:::

## When to use

Use `MapExit` **inside `MapStage`** to link to another `stageId` on the map — the spatial equivalent of `BranchChoice`.

## Requirements

- `targetStageId` must reference another `MapStage` in the same `GameMap`.
- Optional `scoreWeight` when `showMapScore` is enabled on the parent.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-map-exit

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/map-exit"
  title="MapExit component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/map-exit" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-map-exit

```tsx
<MapStage stageId="hub" x={50} y={50} label="Central hub">
  <MapExit label="Visit lab (PPE required)" targetStageId="lab" scoreWeight={1} />
  <MapExit label="Visit open office" targetStageId="office" />
</MapStage>
```
:::

:::{tab-item} AI prompt
:sync-group: component-map-exit

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a MapExit block (H5P-style: Game Map (exit)) like this example inside the active <Lesson>:

<MapStage stageId="hub" x={50} y={50} label="Central hub">
  <MapExit label="Visit lab (PPE required)" targetStageId="lab" scoreWeight={1} />
  <MapExit label="Visit open office" targetStageId="office" />
</MapStage>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- Mount only inside the documented parent compound (see component page When to use).
Packaging notes:
`MapExit` links [`MapStage`](map-stage.md) steps inside a [`GameMap`](game-map.md) — no manifest entry.
- **`targetStageId`** must reference another stage in the same map.
- Optional **`scoreWeight`** when `showMapScore` is enabled on the parent.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync-group: component-map-exit

`MapExit` links [`MapStage`](map-stage.md) steps inside a [`GameMap`](game-map.md) — no manifest entry.

- **`targetStageId`** must reference another stage in the same map.
- Optional **`scoreWeight`** when `showMapScore` is enabled on the parent.
:::

::::
<!-- try-it:end -->
















## See also

- [MapStage](map-stage.md)
- [GameMap](game-map.md)
