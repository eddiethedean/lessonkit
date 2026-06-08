# GameMap

:::{admonition} H5P equivalent
:class: tip

**H5P Game Map**
:::

## When to use

Use `GameMap` for **spatial exploration** — office tours, process maps, or branching worlds anchored on a background image.

Compose `MapStage` nodes with `MapExit` links; terminal stages may include assessments (demo uses `TrueFalse` at the desk).

## Requirements

- `startStageId` must match a `MapStage`.
- `backgroundSrc` should be a safe relative or HTTPS URL.
- Enable `showMapScore` when stages contain scored children.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-game-map

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/game-map"
  title="GameMap component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/game-map" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-game-map

```tsx
<GameMap blockId="office-map" title="Office security tour" backgroundSrc="/map.svg" startStageId="lobby" showMapScore>
  <MapStage stageId="lobby" x={25} y={55} label="Lobby">
    <Text>Badges must be visible in secure areas.</Text>
    <MapExit label="Visit workstation" targetStageId="desk" />
  </MapStage>
  <MapStage stageId="desk" x={65} y={35} label="Workstation">
    <TrueFalse checkId="badge-tf" question="Lock your screen when you leave your desk." answer={true} />
  </MapStage>
</GameMap>
```
:::

:::{tab-item} AI prompt
:sync: component-game-map

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a GameMap block (H5P-style: Game Map) like this example inside the active <Lesson>:

<GameMap blockId="office-map" title="Office security tour" backgroundSrc="/map.svg" startStageId="lobby" showMapScore>
  <MapStage stageId="lobby" x={25} y={55} label="Lobby">
    <Text>Badges must be visible in secure areas.</Text>
    <MapExit label="Visit workstation" targetStageId="desk" />
  </MapStage>
  <MapStage stageId="desk" x={65} y={35} label="Workstation">
    <TrueFalse checkId="badge-tf" question="Lock your screen when you leave your desk." answer={true} />
  </MapStage>
</GameMap>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Packaging notes:
No manifest row for `GameMap` — author [`MapStage`](map-stage.md) and [`MapExit`](map-exit.md) children in React.
- Set **`blockId`**, **`startStageId`**, and stable **`stageId`** on each stage when resume is enabled.
- Nested assessment **`checkId`** values belong in `course.assessments[]`.
- Enable **`showMapScore`** when stages contain scored children or weighted exits.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync: component-game-map

No manifest row for `GameMap` — author [`MapStage`](map-stage.md) and [`MapExit`](map-exit.md) children in React.

- Set **`blockId`**, **`startStageId`**, and stable **`stageId`** on each stage when resume is enabled.
- Nested assessment **`checkId`** values belong in `course.assessments[]`.
- Enable **`showMapScore`** when stages contain scored children or weighted exits.
:::

::::
<!-- try-it:end -->
















## See also

- [MapStage](map-stage.md) · [MapExit](map-exit.md) — map graph primitives
- [Block catalog — GameMap](../block-catalog.md)
