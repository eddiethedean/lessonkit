# BranchChoice

:::{admonition} H5P equivalent
:class: tip

**H5P Branching Scenario (choice)**
:::

## When to use

Use `BranchChoice` **inside `BranchNode`** to offer **labeled navigation** to another `nodeId`. Optional `scoreWeight` contributes to `showPathScore` totals on the parent scenario.

## Requirements

- `targetNodeId` must reference another `BranchNode` in the same scenario.
- Choices render as radio-style buttons; only the active node accepts input.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-branch-choice

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/branch-choice"
  title="BranchChoice component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/branch-choice" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-branch-choice

```tsx
<BranchNode nodeId="fork">
  <Text>Finance flagged a duplicate wire with end-of-day pressure.</Text>
  <BranchChoice label="Escalate and hold payment" targetNodeId="supervisor" scoreWeight={1} />
  <BranchChoice label="Approve to avoid delays" targetNodeId="approve" />
</BranchNode>
```
:::

:::{tab-item} AI prompt
:sync: component-branch-choice

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a BranchChoice block (H5P-style: Branching Scenario (choice)) like this example inside the active <Lesson>:

<BranchNode nodeId="fork">
  <Text>Finance flagged a duplicate wire with end-of-day pressure.</Text>
  <BranchChoice label="Escalate and hold payment" targetNodeId="supervisor" scoreWeight={1} />
  <BranchChoice label="Approve to avoid delays" targetNodeId="approve" />
</BranchNode>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- Mount only inside the documented parent compound (see component page When to use).
Packaging notes:
`BranchChoice` links [`BranchNode`](branch-node.md) steps — no manifest entry.
- **`targetNodeId`** must reference another node in the same scenario.
- Optional **`scoreWeight`** contributes to `showPathScore` on the parent scenario.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync: component-branch-choice

`BranchChoice` links [`BranchNode`](branch-node.md) steps — no manifest entry.

- **`targetNodeId`** must reference another node in the same scenario.
- Optional **`scoreWeight`** contributes to `showPathScore` on the parent scenario.
:::

::::
<!-- try-it:end -->
















## See also

- [BranchNode](branch-node.md)
- [BranchingScenario](branching-scenario.md)
