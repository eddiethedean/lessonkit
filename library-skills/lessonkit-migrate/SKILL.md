---
name: lessonkit-migrate
description: >-
  Migrate LessonKit projects across major versions — 0.9→1.0 (telemetry, plugins),
  1.4→1.5 (BranchingScenario, Embed, Chart, branch resume). Use when upgrading
  @lessonkit/* deps or fixing breaking changes after a release bump.
license: Apache-2.0
metadata:
  lessonkit-version: "1.5.0"
---

# LessonKit version migrations

Pick the guide that matches your **from** version. Run `lessonkit build` and fix TypeScript errors before packaging.

| From | Human guide |
| --- | --- |
| 1.4.x | https://lessonkit.readthedocs.io/en/latest/MIGRATION-1.4-to-1.5.html |
| 1.3.x | https://lessonkit.readthedocs.io/en/latest/MIGRATION-1.3-to-1.4.html |
| 1.2.x | https://lessonkit.readthedocs.io/en/latest/MIGRATION-1.2-to-1.3.html |
| 1.1.x | https://lessonkit.readthedocs.io/en/latest/MIGRATION-1.1-to-1.2.html |
| 1.0.x | https://lessonkit.readthedocs.io/en/latest/MIGRATION-1.0-to-1.1.html |
| 0.9.x | https://lessonkit.readthedocs.io/en/latest/MIGRATION-0.x-to-1.0.html |

## 1.4.x → 1.5.0 (additive)

**Dependency pins (example):**

```json
"@lessonkit/react": "^1.5.0",
"@lessonkit/core": "^1.5.0",
"@lessonkit/cli": "^1.5.0"
```

**New blocks (opt-in):** `BranchingScenario`, `BranchNode`, `BranchChoice`, `Embed`, `Chart`, hook `useBranchingScenario`.

**Branch resume:** Pre-1.5 session state without `__lk_bs__` branch metadata no longer maps `activePageIndex` to JSX node order—learners restart at `startNodeId`. No changes required for courses that do not use branching.

**Telemetry catalog v3:** + `branch_node_viewed`, `branch_selected`.

Full checklist: `references/checklist-1.4-to-1.5.md` (if present) · [golden example](https://github.com/eddiethedean/lessonkit/tree/main/examples/branching-scenario)

## 0.9.x → 1.0 (breaking)

**Dependency pins (example):**

```json
"@lessonkit/react": "^1.5.0",
"@lessonkit/core": "^1.5.0",
"@lessonkit/cli": "^1.5.0"
```

### Breaking API removals

| Removed | Replacement |
|---------|-------------|
| `buildTrackEvent` / `tryBuildTrackEvent` | `buildTelemetryEvent` / `tryBuildTelemetryEvent` from `@lessonkit/core` |
| `defineLessonkitPlugin` | `defineTelemetryPlugin`, `defineAssessmentPlugin`, `defineLifecyclePlugin` |
| `createPluginHost` | `createPluginRegistry` |
| `setLxpackBridgeMode` | `config.lxpack.bridge` or `forwardTelemetryToBridge(event, mode)` |

### Runtime

- Default `runtimeVersion: "v2"` (headless runtime in core).
- Opt out: `runtimeVersion: "v1"` on provider config.

### Import paths

Do not import from `@lessonkit/react/runtime/*` — use package root or `@lessonkit/core`.

Full checklist: `references/checklist.md`  
Human guide: https://lessonkit.readthedocs.io/en/latest/MIGRATION-0.x-to-1.0.html

## Do not

- Bump major/minor without reading the matching migration guide
- Use console-only telemetry sinks in production builds (production guard throws)
- Expect `wrapTrackingSink` to skip batched `batchSink` (fixed in 1.0.0 — wrappers apply on flush)
