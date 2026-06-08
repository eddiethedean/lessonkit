# CLI and packaging error catalog

Quick lookup for common `lessonkit` failures. Exit codes: [CLI reference — exit codes](cli.md#exit-codes). Structured failures use `--json` (`code`, `message`, `issues[]`).

## Exit codes

| Code | `code` field | Meaning |
| --- | --- | --- |
| `0` | — | Success |
| `1` | `RUNTIME` | Build failed, subprocess error, timeout |
| `2` | `INVALID_PROJECT` | Missing/invalid `lessonkit.json`, bad init args |
| `3` | `PACKAGING` | LXPack validation, parity errors, reserved paths |

## Project discovery and manifest

| Message (substring) | Cause | Fix |
| --- | --- | --- |
| `Could not find lessonkit.json` | Not in a LessonKit project directory | `cd` to project root or pass `--cwd` |
| `Failed to read or parse lessonkit.json` | Invalid JSON | Fix syntax; validate with a JSON linter |
| `schemaVersion must be 1` | Wrong `schemaVersion` | Set `"schemaVersion": 1` (string `"1"` is accepted at parse time) |
| `per-lesson-spa layout is not supported` | `course.layout: "per-lesson-spa"` | Use `"single-spa"` or package via `@lessonkit/lxpack` directly |
| `course.lessons must be an array` | `lessons` is not an array | Fix `lessonkit.json` structure |
| `invalid paths` / `paths.spaDistDir must be a non-empty string` | Bad `paths.*` values | Use relative paths under project root; see [Manifest reference](manifest.md) |
| `path must not target reserved directories` | Output under `.git`, `node_modules`, `.github` | Change `paths.lxpackOutDir` or `paths.outputBaseDir` |
| `path must resolve inside the project root` | `..` or absolute escape in `paths.*` | Keep paths relative without `..` segments |

## Build and dist

| Message (substring) | Cause | Fix |
| --- | --- | --- |
| `dist directory not found` / `Run lessonkit build first` | No Vite output | Run `npm run build` or omit `--no-build` |
| `Build did not produce index.html` | Wrong `paths.spaDistDir` or failed build | Check Vite `outDir` matches `paths.spaDistDir` |
| `Build completed but dist directory not found` | Build exited 0 but dist missing | Inspect Vite config and build logs |
| `exited with code` / `timed out after` | Vite/npm subprocess failure | Fix build errors; raise `LESSONKIT_CMD_TIMEOUT_MS` if needed |

## Packaging and parity

| Message (substring) | Cause | Fix |
| --- | --- | --- |
| `Packaging failed` | LXPack validation (descriptor, assessments, paths) | Read `issues[]` with `--json`; fix manifest assessments |
| `does not reference courseId=` | React `courseId` ≠ manifest | Align `<Course courseId>` and `lessonkit.json` |
| `missing checkId=` | Quiz in React not in manifest | Add matching `course.assessments[]` entry |
| `missing lessonId=` | Manifest lesson not referenced in source | Add `<Lesson lessonId>` or remove unused manifest lesson |
| `React app source required for ID parity` | No `src/` but manifest has IDs | Add React source or fix manifest |
| `Source tree contains symlink` | Symlink under `src/` | Remove symlinks from source tree |
| `--strict-parity` warnings as errors | ID drift warnings treated as fatal | Fix warnings or drop `--strict-parity` |

## Init

| Message (substring) | Cause | Fix |
| --- | --- | --- |
| `Directory already exists` | `lessonkit init name` collision | Pick another name or remove directory |
| `Directory is not empty` | `init --here` on non-empty dir | Use empty dir, dotfiles only, or `--force` with `--here` |
| `--force requires --here` | `--force` without `--here` | Use `lessonkit init --here --force` |
| `Bundled template not found` | Broken CLI install | Reinstall `@lessonkit/cli` |
| `Project name is required` | Missing name argument | `lessonkit init my-course` or `lessonkit init --here` |

## Package flags

| Message (substring) | Cause | Fix |
| --- | --- | --- |
| `--target is required` | Missing `--target` | `lessonkit package --target scorm12` |
| `--out` outside project | Override path escapes root | Use a path inside the project directory |

## SCORM zip location

Default artifact after `package:scorm12`:

```text
.lxpack/course/.lxpack/out/course-scorm12.zip
```

(relative to project root when using default `paths`). See [LMS Go-Live — SCORM layout](../guides/react-developers/lms-go-live.md).

## Related

- [CLI reference](cli.md)
- [Manifest reference](manifest.md)
- [LMS Go-Live guide](../guides/react-developers/lms-go-live.md)
- [FAQ](../guides/faq.md)
