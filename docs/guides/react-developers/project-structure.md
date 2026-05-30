# Project structure

## CLI-generated project

```text
my-course/
├── lessonkit.json      # schemaVersion 1 — packaging + course descriptor
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx         # your course UI
│   └── styles.css
└── dist/               # after lessonkit build
```

`lessonkit.json` is the contract between your React app and `@lessonkit/lxpack`:

- `course.courseId`, `lessons[].id`, `assessments[].checkId` must match React props
- `course.layout` should be `single-spa` for `lessonkit package` (0.9.3)
- `paths.spaDistDir` points at the Vite output (default `dist`)

`lessonkit init` patches `App.tsx` `courseId` and title to match the manifest.

## Monorepo layout

```text
lessonkit/
├── packages/
│   ├── core/           # telemetry, identity
│   ├── react/          # components + provider
│   ├── xapi/
│   ├── accessibility/
│   ├── themes/
│   ├── lxpack/         # packaging adapter (Node 20+)
│   └── cli/
├── examples/
│   ├── react-vite/
│   └── lxpack-golden/
└── docs/               # this documentation site
```

## When to use which package

| Package | Use when |
| --- | --- |
| `@lessonkit/react` | Always, for UI and runtime |
| `@lessonkit/core` | Custom telemetry sinks, types, identity helpers |
| `@lessonkit/xapi` | Custom LRS transports or statement inspection |
| `@lessonkit/themes` | Extending presets consumed by `ThemeProvider` |
| `@lessonkit/accessibility` | Focus trap / roving tabindex in custom modals |
| `@lessonkit/lxpack` | Programmatic packaging outside the CLI |
| `@lessonkit/cli` | Standard init/dev/build/package workflow |

See [CLI reference](../../reference/cli.md) and [Packaging reference](../../reference/packaging.md).
