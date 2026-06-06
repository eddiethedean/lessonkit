# Migrating from LessonKit 1.4.x to 1.5.0

## Summary

| Area | 1.4.x | 1.5.0 |
| --- | --- | --- |
| Compound containers | Linear (`InteractiveBook`, `SlideDeck`, `InteractiveVideo`) | + `BranchingScenario`, `BranchNode`, `BranchChoice` (graph navigation) |
| Content blocks | Tier C/D (1.4) | + `Embed` (sandboxed iframe), `Chart` (bar/pie + table fallback) |
| Hooks | — | + `useBranchingScenario()` for path introspection |
| Telemetry catalog v3 | `video_cue_*`, … | + `branch_node_viewed`, `branch_selected` |
| Block catalog v3 | 38 entries | + 5 new block types (43 total) |

## Additive API

```tsx
import {
  BranchingScenario,
  BranchNode,
  BranchChoice,
  Embed,
  Chart,
  useBranchingScenario,
} from "@lessonkit/react";
```

Branching scenario example:

```tsx
<BranchingScenario blockId="resolution-paths" title="Resolution paths" startNodeId="offer" showPathScore showPathRecap>
  <BranchNode nodeId="offer">
    <Scenario>
      <p>How do you close the loop?</p>
    </Scenario>
    <BranchChoice label="Offer credit" targetNodeId="credit" />
    <BranchChoice label="Supervisor" targetNodeId="supervisor" />
  </BranchNode>
  <BranchNode nodeId="credit" terminal>
    <TrueFalse checkId="credit-check" question="Document credit?" answer={true} />
  </BranchNode>
  <BranchNode nodeId="supervisor" terminal>
    <Text>Stay on the line until the supervisor joins.</Text>
  </BranchNode>
</BranchingScenario>
```

`BranchingScenario` implements `CompoundHandle` with **visited-path-only** score aggregation and graph resume (`activeNodeId`, `visitedNodeIds`) stored in compound session state.

## Telemetry

| Event | When |
| --- | --- |
| `branch_node_viewed` | Learner activates a branch node |
| `branch_selected` | Learner picks a `BranchChoice` (xAPI `answered` when `scoreWeight` is set) |

See [Telemetry reference](reference/telemetry.md).

## Allowlists

- `BranchingScenario` → `BranchNode` only
- `BranchNode` → content + assessment blocks (Page-like set), plus `BranchChoice`, `Embed`, `Chart`
- Nested `BranchingScenario` is not supported in 1.5.0

See [H5P capability map](project/h5p-capability-map.md).

## Golden example

[`examples/branching-scenario`](../examples/branching-scenario/) — SCORM-packaged demo with scored branch path.

## Breaking changes

None for existing 1.4.x courses. All additions are opt-in imports.
