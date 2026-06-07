# LessonKit packages

Published npm packages under [`@lessonkit/*`](https://www.npmjs.com/org/lessonkit). Course authors usually install **`@lessonkit/react`** plus **`@lessonkit/cli`** (devDependency); contributors work from this monorepo.

| Package | When you need it | README |
| --- | --- | --- |
| [`@lessonkit/react`](react/) | Course UI—components, hooks, `ThemeProvider`, block catalog | [react/README.md](react/README.md) |
| [`@lessonkit/cli`](cli/) | Scaffold (`init`), dev server wrapper, build, LMS packaging | [cli/README.md](cli/README.md) |
| [`@lessonkit/core`](core/) | Headless runtime, telemetry types, identity, plugin registry | [core/README.md](core/README.md) |
| [`@lessonkit/xapi`](xapi/) | xAPI statements, fetch transports, telemetry → statement mapping | [xapi/README.md](xapi/README.md) |
| [`@lessonkit/lxpack`](lxpack/) | `lessonkit.json` validation, SCORM/xAPI/cmi5 packaging (used by CLI) | [lxpack/README.md](lxpack/README.md) |
| [`@lessonkit/themes`](themes/) | Theme presets and `--lk-*` design tokens | [themes/README.md](themes/README.md) |
| [`@lessonkit/accessibility`](accessibility/) | Focus trap, roving tabindex, reduced-motion helpers | [accessibility/README.md](accessibility/README.md) |

**Typical installs**

```bash
# New course (recommended)
npx @lessonkit/cli init my-course

# Existing Vite + React app
npm install @lessonkit/react react react-dom
npm install -D @lessonkit/cli @lessonkit/xapi
```

Docs: [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/) · Block catalog: [reference/block-catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html)
