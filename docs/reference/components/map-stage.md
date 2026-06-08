# MapStage

:::{admonition} H5P equivalent
:class: tip

**H5P Game Map (stage)**
:::

## When to use

Use `MapStage` **only inside [`GameMap`](game-map.md)**. Each stage is content shown when the learner visits a point on the background image (`x`/`y` percentages position the marker).

## Requirements

- `stageId` must be unique within the map.
- `startStageId` on the parent must match a stage.
- Children may include `MapExit`, content blocks, and assessments.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-map-stage

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/map-stage"
  title="MapStage component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/map-stage" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-map-stage

```tsx
<GameMap blockId="zones" title="Building zones" backgroundSrc="/map.svg" startStageId="lobby">
  <MapStage stageId="lobby" x={30} y={55} label="Lobby">
    <Text>Reception verifies visitors before secure areas.</Text>
    <MapExit label="Enter work floor" targetStageId="floor" />
  </MapStage>
  <MapStage stageId="floor" x={70} y={40} label="Work floor">
    <TrueFalse checkId="stage-tf" question="Tailgating is acceptable when you recognize someone." answer={false} />
  </MapStage>
</GameMap>
```
:::

:::{tab-item} AI prompt
:sync-group: component-map-stage

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a MapStage block (H5P-style: Game Map (stage)) like this example inside the active <Lesson>:

<GameMap blockId="zones" title="Building zones" backgroundSrc="/map.svg" startStageId="lobby">
  <MapStage stageId="lobby" x={30} y={55} label="Lobby">
    <Text>Reception verifies visitors before secure areas.</Text>
    <MapExit label="Enter work floor" targetStageId="floor" />
  </MapStage>
  <MapStage stageId="floor" x={70} y={40} label="Work floor">
    <TrueFalse checkId="stage-tf" question="Tailgating is acceptable when you recognize someone." answer={false} />
  </MapStage>
</GameMap>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- Mount only inside the documented parent compound (see component page When to use).
Packaging notes:
`MapStage` is a child of [`GameMap`](game-map.md) — no manifest row for the stage itself.
- Unique **`stageId`** per stage; **`startStageId`** on the parent must match one stage.
- Children may include `MapExit`, content blocks, and assessments.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync-group: component-map-stage

`MapStage` is a child of [`GameMap`](game-map.md) — no manifest row for the stage itself.

- Unique **`stageId`** per stage; **`startStageId`** on the parent must match one stage.
- Children may include `MapExit`, content blocks, and assessments.
:::

::::
<!-- try-it:end -->
















## See also

- [MapExit](map-exit.md)
- [GameMap](game-map.md)
