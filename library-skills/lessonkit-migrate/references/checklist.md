# Migration checklist

- [ ] All `@lessonkit/*` at `^1.1.0` (or pin `^1.0.2` until you adopt 1.1 assessment blocks)
- [ ] Replace `buildTrackEvent` → `buildTelemetryEvent`
- [ ] Replace `defineLessonkitPlugin` → `define*Plugin` + `createPluginRegistry`
- [ ] Remove `setLxpackBridgeMode`; use `config.lxpack.bridge`
- [ ] Confirm `lessonkit.json` `schemaVersion: 1`, `layout: "single-spa"`
- [ ] `lessonkit build` passes
- [ ] `lessonkit package --target scorm12` on Node 18+
- [ ] Quiz blocks inside `<Lesson>` for correct `lessonId` on telemetry

## Monorepo contributors

See https://lessonkit.readthedocs.io/en/latest/guides/react-developers/contributing-to-the-monorepo.html
