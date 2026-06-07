# Performance

Practical guidance for bundle size, runtime I/O, and telemetry batching in LessonKit courses.

## Package imports

| Import | Use when |
| --- | --- |
| `@lessonkit/react` | Full course app (default CLI template) |
| `@lessonkit/react/blocks` | Tree-shake block components only in custom bundler setups |

Most courses import from `@lessonkit/react` — the CLI template already optimizes for developer ergonomics over minimal bundle bytes. Measure before splitting imports.

## Analyze bundle size

```bash
npm run build
npx vite-bundle-visualizer   # or your preferred analyzer on dist/
```

Large dependencies usually come from **your** media assets and custom libraries, not LessonKit core.

## Lazy loading

Defer heavy routes or optional modules with React `lazy()`:

```tsx
const AdvancedSim = lazy(() => import("./AdvancedSim"));

<Suspense fallback={<p>Loading...</p>}>
  <AdvancedSim />
</Suspense>
```

Compound children (`Page`, `Slide`, `TimedCue`) render eagerly by default — split rarely-used chapters into separate lazy-loaded React subtrees if profiling shows benefit.

## Compound state I/O

When `config.session.persistCompoundState` is true (default), compound blocks read/write `sessionStorage` on navigation. Costs are small per transition but add up in rapid keyboard navigation tests.

- Disable for kiosk demos: `session: { persistCompoundState: false }`
- Clear state on logout in multi-user kiosks: `clearCompoundState()` from `@lessonkit/core`

See [Core reference — compound state](../../reference/core.md#compound-state-and-resume).

## Telemetry batching

Tune batch delivery in `courseConfig.ts`:

```typescript
tracking: {
  batch: {
    enabled: true,
    flushIntervalMs: 5000,  // increase for low-priority analytics
    maxBatchSize: 50,       // decrease if proxy payload limits are tight
  },
},
```

Lower frequency reduces network chatter; higher latency before analytics dashboards update.

## xAPI queue

Default in-memory queue max is **1000** statements. Under LRS slowness, monitor `onXapiQueueDepth` rather than increasing queue size indefinitely — see [LRS operations](lrs-operations.md).

## Media

- Self-host video with reasonable bitrates; use `poster` on `Video` / `InteractiveVideo`
- Prefer WebVTT captions over burned-in text for accessibility and bandwidth

## Related

- [Deployment guide](deployment-guide.md)
- [Production checklist](production-checklist.md)
