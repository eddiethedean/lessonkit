# Quickstart (React)

:::{admonition} New to React?
:class: tip

See [Learn React first](index.md#new-to-react) for curated tutorials (react.dev, TypeScript, Vite) before customizing a full course.
:::

## CLI scaffold

```bash
npx @lessonkit/cli init my-course
cd my-course
npm run dev
```

See [Getting started in 5 minutes](getting-started-in-5-minutes.md) for build, SCORM packaging, and output paths.

:::{admonition} Production builds
:class: warning

**Tracking defaults on** when `config.tracking` is omitted or partially set. `npm run build` followed by preview rejects console-only sinks unless you wire real transports (see `createFetchBatchSink` below) or set `tracking: { enabled: false }`. xAPI behaves similarly—provide `xapi.transport` or `xapi: { enabled: false }`. Details: [production checklist](production-checklist.md).
:::

## Add to an existing Vite + React app

```bash
npm install @lessonkit/react react react-dom
npm install -D @lessonkit/cli @lessonkit/xapi
```

`@lessonkit/react` already depends on `core`, `themes`, `xapi`, and `lxpack`. Add `@lessonkit/core` only for headless APIs; add `@lessonkit/xapi` in devDependencies when you want typed `XAPIStatement` imports in app code.

Wrap your app (or course subtree):

```tsx
import { useMemo } from "react";
import { Course, Lesson, Quiz, Scenario, ThemeProvider } from "@lessonkit/react";
import { createFetchBatchSink, createFetchTransport } from "@lessonkit/xapi";

export default function App() {
  const config = useMemo(() => {
    const xapiFetch = createFetchTransport({ url: "/api/xapi/statements", timeoutMs: 30_000 });
    const analytics = createFetchBatchSink({ url: "/api/telemetry/batch", timeoutMs: 30_000 });
    return {
      tracking: {
        batchSink: analytics.batchSink,
        exitBatchSink: analytics.exitBatchSink,
        batch: { enabled: true, flushIntervalMs: 5000, maxBatchSize: 25 },
      },
      xapi: {
        transport: xapiFetch.transport,
        exitTransport: xapiFetch.exitTransport,
      },
      observability: {
        onTelemetrySinkError: (err) => console.error("[telemetry]", err),
        onTelemetryBufferDrop: () => console.warn("[telemetry] buffer cap"),
        onXapiQueueDepth: (depth) => depth > 100 && console.warn("[xapi] queue", depth),
        onXapiQueueCap: () => console.warn("[xapi] queue cap"),
        onLxpackBridgeMiss: (event) => console.warn("[bridge]", event.name),
      },
    };
  }, []);

  return (
    <ThemeProvider mode="light" preset="default">
      {/* Course wraps LessonkitProvider; pass config here */}
      <Course title="My Course" courseId="my-course" config={config}>
        <Lesson title="Intro" lessonId="intro">
          <Scenario>
            <p>Welcome.</p>
          </Scenario>
          <Quiz
            checkId="intro-check"
            question="Ready to continue?"
            choices={["No", "Yes"]}
            answer="Yes"
          />
        </Lesson>
      </Course>
    </ThemeProvider>
  );
}
```

:::{admonition} Local development only
:class: note

The example above uses `console.*` in observability hooks for visibility while building. In production, send these signals to your monitoring stack—see [production checklist](production-checklist.md).
:::

(keep-react-ids-in-sync-with-lessonkitjson)=
## Keep React IDs in sync with lessonkit.json

Packaging reads **`lessonkit.json`** and validates it against your built SPA. As of **1.3.0**, `lessonkit package` also scans `src/**/*.{ts,tsx}` and **fails** when `course.courseId` or any manifest `checkId` is missing from React source (`validateReactManifestParity` in `@lessonkit/lxpack`).

```text
lessonkit.json                    src/App.tsx
─────────────────────────────────────────────────
course.courseId  ───────────────►  <Course courseId="…">
lessons[].id     ───────────────►  <Lesson lessonId="…">  (when listed)
assessments[].checkId ──────────►  <Quiz checkId="…"> / other checks
```

Rules of thumb:

1. Every `checkId` in React must appear under `course.assessments` with the same id.
2. `courseId` on `Course` must equal `course.courseId` in the manifest.
3. With `layout: "single-spa"`, the manifest may list only shell lessons while extra in-app steps exist only in React—see [lxpack-golden](https://github.com/eddiethedean/lessonkit/blob/main/examples/lxpack-golden/README.md).

:::{admonition} Common packaging failures
:class: warning

| Symptom | Fix |
| --- | --- |
| Unknown or missing `checkId` in React source | Add `checkId="…"` in React **and** the assessment in `lessonkit.json` |
| `courseId` mismatch | Align `Course` and `course.courseId` (package validates React source) |
| Empty `dist/` | Run `npm run build` before `lessonkit package` |
| Wrong layout | Use `"layout": "single-spa"` for standard CLI package |
:::

## Monorepo example

For contributors and demo apps only:

```bash
git clone https://github.com/eddiethedean/lessonkit.git
cd lessonkit && npm install && npm run build:packages
npm -w lessonkit-example-react-vite run dev
```

## Next steps

- [Getting started in 5 minutes](getting-started-in-5-minutes.md)
- [Production checklist](production-checklist.md)
- [Project structure](project-structure.md)
- [Components and hooks](components-and-hooks.md)
- [Glossary](../../reference/glossary.md)
- [Packaging and CLI](packaging-and-cli.md)
