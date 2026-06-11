# BranchNode

:::{admonition} H5P equivalent
:class: tip

**H5P Branching Scenario (node)**
:::

:::{admonition} Parent compound
:class: important

`BranchNode` only works inside [`BranchingScenario`](branching-scenario.md). The parent hides inactive nodes and shows path progress via the built-in path indicator and status line.
:::

## When to use

Use `BranchNode` **only inside [`BranchingScenario`](branching-scenario.md)**. Each node is a step in the graph: narrative content, optional `BranchChoice` children, and an optional `terminal` flag for end states.

Terminal nodes are styled distinctly and trigger the parent’s completion banner.

## Requirements

- `nodeId` must be unique within the scenario.
- `startNodeId` on the parent must match an existing node.
- Terminal nodes often hold assessments or completion copy.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-branch-node

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/branch-node"
  title="BranchNode component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/branch-node" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-branch-node

```tsx
<BranchingScenario blockId="card-dispute" title="Card dispute call" startNodeId="start" showPathScore>
  <BranchNode nodeId="start" title="Opening">
    <Text>Caller reports a duplicate charge after a shipping notification link.</Text>
    <BranchChoice label="Listen and verify identity" targetNodeId="verify" />
  </BranchNode>
  <BranchNode nodeId="verify" title="Verify" terminal>
    <Text>Identity confirmed and fraud ticket opened.</Text>
  </BranchNode>
</BranchingScenario>
```
:::

:::{tab-item} AI prompt
:sync: component-branch-node

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a BranchNode block (H5P-style: Branching Scenario (node)) like this example inside the active <Lesson>:

<BranchingScenario blockId="card-dispute" title="Card dispute call" startNodeId="start" showPathScore>
  <BranchNode nodeId="start" title="Opening">
    <Text>Caller reports a duplicate charge after a shipping notification link.</Text>
    <BranchChoice label="Listen and verify identity" targetNodeId="verify" />
  </BranchNode>
  <BranchNode nodeId="verify" title="Verify" terminal>
    <Text>Identity confirmed and fraud ticket opened.</Text>
  </BranchNode>
</BranchingScenario>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- Mount only inside the documented parent compound (see component page When to use).
Packaging notes:
`BranchNode` is a child of [`BranchingScenario`](branching-scenario.md) — configure the graph in React, not `lessonkit.json`.
- Unique **`nodeId`** per node; **`startNodeId`** on the parent must match one node.
- Mark ending nodes with **`terminal`** when the path should stop.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync: component-branch-node

`BranchNode` is a child of [`BranchingScenario`](branching-scenario.md) — configure the graph in React, not `lessonkit.json`.

- Unique **`nodeId`** per node; **`startNodeId`** on the parent must match one node.
- Mark ending nodes with **`terminal`** when the path should stop.
:::

::::
<!-- try-it:end -->




















## See also

- [BranchChoice](branch-choice.md)
- [BranchingScenario](branching-scenario.md)
