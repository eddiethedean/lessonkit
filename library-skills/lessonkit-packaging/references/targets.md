# Package targets

## CLI

```bash
lessonkit package --target scorm12
lessonkit package --target scorm2004
lessonkit package --target standalone
lessonkit package --target xapi
lessonkit package --target cmi5
```

Optional: `--cwd`, `--json` for automation.

## lessonkit.json paths

| Field | Default | Role |
|-------|---------|------|
| `paths.spaDistDir` | `dist` | Vite build output copied into package |
| `paths.lxpackOutDir` | `.lxpack/course` | Staging LXPack project |
| `paths.outputBaseDir` | `.lxpack/out` | Final ZIP / standalone folder |

## xAPI / cmi5

Configure tracking in `lessonkit.json` / course descriptor per packaging reference. Validate with export parity tests in the monorepo when changing adapters.

Human reference: https://lessonkit.readthedocs.io/en/latest/reference/packaging.html
