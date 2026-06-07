# Migration checklist: 1.4.x → 1.5.0

- [ ] Pin aligned `@lessonkit/*` at `^1.5.0` (react, core, cli, xapi, lxpack, themes, accessibility)
- [ ] Run `npm install` and `lessonkit build` — fix TypeScript errors
- [ ] Optional: adopt `BranchingScenario`, `Embed`, `Chart` blocks (additive; no breaking changes required)
- [ ] If using branching: set unique `blockId` on `BranchingScenario`; test graph resume in LMS
- [ ] Branch resume: pre-1.5 session state without `__lk_bs__` metadata restarts at `startNodeId` (expected)
- [ ] Telemetry catalog v3 adds `branch_node_viewed`, `branch_selected` (additive)
- [ ] `lessonkit package --target scorm12` smoke test on Node 18+

Human guide: https://lessonkit.readthedocs.io/en/latest/MIGRATION-1.4-to-1.5.html
