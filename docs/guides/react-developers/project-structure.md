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

- `course.courseId` and every `assessments[].checkId` **must match** React props
- `lessons[].id` **must match** when each lesson is a separate SPA or LMS entry; with `layout: "single-spa"`, the manifest lists only the LMS shell lesson(s) while additional in-app step ids may exist only in React (see [lxpack-golden README](https://github.com/eddiethedean/lessonkit/blob/main/examples/lxpack-golden/README.md))
- `course.layout` should be `single-spa` for `lessonkit package` (1.0.0)
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
│   ├── lxpack/         # packaging adapter (Node 18+)
│   └── cli/
├── examples/
│   ├── react-vite/
│   ├── data-privacy/
│   ├── customer-service/
│   └── lxpack-golden/
├── library-skills/
├── e2e/
├── integration/
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
