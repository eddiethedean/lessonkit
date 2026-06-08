# BranchingScenario

:::{admonition} H5P equivalent
:class: tip

**H5P Branching Scenario** — directed graph of nodes and choices with optional terminal assessments.
:::

## When to use

Use `BranchingScenario` when learner **decisions change the path** — customer de-escalation, ethics dilemmas, troubleshooting trees, or “choose your response” simulations.

Compose with:

- `BranchNode` — narrative and choices (`BranchChoice` children)
- `BranchChoice` — `label` + `targetNodeId`
- Terminal nodes — may include scored blocks like `TrueFalse`

Set `startNodeId` to the entry node. Use `showPathScore` when terminal nodes contain assessments.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-branching-scenario

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/branching-scenario"
  title="BranchingScenario component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/branching-scenario" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-branching-scenario

```tsx
<BranchingScenario blockId="call-paths" title="Suspicious charge call" startNodeId="opening" showPathScore>
  <BranchNode nodeId="opening">
    <Text>A customer reports a duplicate charge after clicking a shipping email link.</Text>
    <BranchChoice label="Acknowledge concern and verify account" targetNodeId="empathy" />
    <BranchChoice label="Quote the no-refund policy first" targetNodeId="policy" />
  </BranchNode>
  <BranchNode nodeId="empathy" terminal>
    <Text>You secured the account and escalated to fraud review.</Text>
  </BranchNode>
</BranchingScenario>
```
:::

:::{tab-item} AI prompt
:sync-group: component-branching-scenario

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a BranchingScenario block (H5P-style: Branching Scenario) like this example inside the active <Lesson>:

<BranchingScenario blockId="call-paths" title="Suspicious charge call" startNodeId="opening" showPathScore>
  <BranchNode nodeId="opening">
    <Text>A customer reports a duplicate charge after clicking a shipping email link.</Text>
    <BranchChoice label="Acknowledge concern and verify account" targetNodeId="empathy" />
    <BranchChoice label="Quote the no-refund policy first" targetNodeId="policy" />
  </BranchNode>
  <BranchNode nodeId="empathy" terminal>
    <Text>You secured the account and escalated to fraud review.</Text>
  </BranchNode>
</BranchingScenario>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Packaging notes:
No manifest row for `BranchingScenario` unless nodes contain scored blocks.
- Set stable **`blockId`** and valid **`startNodeId`** when using session resume.
- Optional **`showPathScore`** aggregates visited-path weights from [`BranchChoice`](branch-choice.md).
- Validate the graph with `validateBranchGraph()` from `@lessonkit/core`. See [Core — branching](../core.md#branching-scenario-meta).
- Add `course.assessments[]` only for embedded checks (for example `branch-tf` on a terminal node).

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync-group: component-branching-scenario

No manifest row for `BranchingScenario` unless nodes contain scored blocks.

- Set stable **`blockId`** and valid **`startNodeId`** when using session resume.
- Optional **`showPathScore`** aggregates visited-path weights from [`BranchChoice`](branch-choice.md).
- Validate the graph with `validateBranchGraph()` from `@lessonkit/core`. See [Core — branching](../core.md#branching-scenario-meta).
- Add `course.assessments[]` only for embedded checks (for example `branch-tf` on a terminal node).
:::

::::
<!-- try-it:end -->
















## See also

- [BranchNode](branch-node.md) · [BranchChoice](branch-choice.md) — graph primitives
- [customer-service example](../../examples/index.md#customer-de-escalation-examplescustomer-service)
- [Block catalog — BranchingScenario](../block-catalog.md)
- [Migration 1.4 → 1.5](../../MIGRATION-1.4-to-1.5.md)
