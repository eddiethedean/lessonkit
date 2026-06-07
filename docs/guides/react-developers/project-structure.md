# Project structure

## CLI-generated project

```text
my-course/
├── lessonkit.json      # schemaVersion 1 — packaging + course descriptor
├── package.json        # npm scripts: dev, build, package:scorm12, …
├── .env.example        # VITE_XAPI_PROXY_URL, VITE_ANALYTICS_URL
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx         # course UI (IDs match lessonkit.json)
│   ├── courseConfig.ts # tracking, xAPI, observability, lxpack bridge
│   └── styles.css
├── dist/               # after lessonkit build (paths.spaDistDir)
└── .lxpack/course/     # LXPack staging (paths.lxpackOutDir)
    └── .lxpack/out/    # packaged zips (paths.outputBaseDir)
```

### Key npm scripts

| Script | Command |
| --- | --- |
| `npm run dev` | `lessonkit dev` — Vite dev server |
| `npm run build` | `lessonkit build` — production SPA to `dist/` |
| `npm run package:scorm12` | `lessonkit package --target scorm12` |
| `npm run package:standalone` | `lessonkit package --target standalone` |

Default SCORM output: **`.lxpack/course/.lxpack/out/course-scorm12.zip`**.

### `courseConfig.ts`

Central runtime config: telemetry sinks, xAPI transport, observability hooks, and `lxpack.bridge`. Set `bridge: "auto"` before LMS packaging. See [Prepare for LMS packaging](getting-started-in-5-minutes.md#5-prepare-for-lms-packaging).

`lessonkit.json` is the contract between your React app and `@lessonkit/lxpack`:

- `course.courseId` and every `assessments[].checkId` **must match** React props
- `lessons[].id` **must match** when each lesson is a separate SPA or LMS entry; with `layout: "single-spa"`, the manifest lists only the LMS shell lesson(s) while additional in-app step ids may exist only in React (see [lxpack-golden README](https://github.com/eddiethedean/lessonkit/blob/main/examples/lxpack-golden/README.md))
- `course.layout` should be `single-spa` for `lessonkit package` (1.0.0)
- `paths.spaDistDir` points at the Vite output (default `dist`)
- `paths.lxpackOutDir` (default `.lxpack/course`) and `paths.outputBaseDir` (default `.lxpack/out`, resolved inside `lxpackOutDir`)

`lessonkit init` patches `App.tsx` `courseId`, `courseConfig.ts`, and title to match the manifest.

## Monorepo layout

```text
lessonkit/
├── packages/
│   ├── core/              # telemetry, identity, headless runtime
│   ├── react/             # components + provider
│   ├── xapi/
│   ├── accessibility/
│   ├── themes/
│   ├── lxpack/            # packaging adapter (Node 18+)
│   └── cli/
├── examples/
│   ├── react-vite/        # RTD demos
│   ├── data-privacy/
│   ├── customer-service/
│   ├── lxpack-golden/     # packaging reference
│   ├── interactive-book/  # compound containers (1.2)
│   ├── slide-deck/        # SlideDeck compound (1.3)
│   ├── framework-11-showcase/  # complete 1.1 catalog
│   ├── framework-12-showcase/  # complete 1.2 catalog
│   └── assessments-p0/    # P0 assessment blocks
├── templates/             # synced with CLI template
├── library-skills/
├── e2e/
├── integration/
└── docs/                  # this documentation site
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
