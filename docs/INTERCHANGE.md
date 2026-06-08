# Portable interchange (`.lkcourse`) (1.6.x)

LessonKit ships three related manifest layers. This page documents the **portable archive** format introduced in **1.6.0**.

## Three manifest layers

| Layer | Location | Purpose |
| --- | --- | --- |
| **Author manifest** | Project root `lessonkit.json` (`schemaVersion: 1`) | CLI discovery, course descriptor, build paths. See [Manifest reference](reference/manifest.md). |
| **LXPack interchange** | `.lxpack/course/lessonkit.json` (generated at package time) | LMS packaging metadata derived from the descriptor via `descriptorToInterchange()`. |
| **Portable archive** | `.lkcourse` zip → `manifest.json` envelope | Archive, share, and tool against a **built** course without treating SCORM/xAPI zips as source of truth. |

**Not the same as LMS delivery:** upload SCORM/xAPI/cmi5 artifacts from `lessonkit package` to your LMS. Use `.lkcourse` for team handoff, backups, and codegen/tooling pipelines.

## Archive layout

A valid `.lkcourse` zip contains:

```text
course.lkcourse
├── manifest.json       # lkcourse envelope (format metadata + embedded sourceManifest)
├── interchange.json    # LXPack LessonkitInterchangeV1
├── dist/               # Vite production build (paths.spaDistDir)
│   ├── index.html
│   └── assets/...
└── block-tree.json     # optional — best-effort JSX block inventory
```

JSON schemas ship from `@lessonkit/lxpack`:

- `@lessonkit/lxpack/lkcourse-format.v1.json` — envelope (`manifest.json`)
- `@lessonkit/lxpack/block-tree.v1.json` — optional `block-tree.json`

## Envelope (`manifest.json`)

| Field | Description |
| --- | --- |
| `format` | Must be `"lkcourse"` |
| `schemaVersion` | Must be `1` |
| `lessonkitVersion` | Framework version at export time |
| `exportedAt` | ISO-8601 timestamp |
| `sourceManifest` | Lossless copy of root `lessonkit.json` for round-trip import |
| `entries` | Sorted list of relative paths inside the zip (validation + zip-slip checks) |

`interchange.json` is the LXPack interchange view of the same course (lessons, assessments, runtime theme, tracking). Export validates that `sourceManifest.course.courseId` matches `interchange.course.id`.

## CLI

### Export

```bash
lessonkit build
lessonkit export
lessonkit export --out backups/workplace-safety.lkcourse
lessonkit export --no-build --with-block-tree
lessonkit export --json
```

| Flag | Description |
| --- | --- |
| `--cwd` | Project root |
| `--out` | Output path relative to project root (default: `{name}.lkcourse`) |
| `--no-build` | Skip implicit Vite build; requires existing `dist/` |
| `--with-block-tree` | Include optional `block-tree.json` from `src/` JSX scan |
| `--json` | Structured JSON on stdout |

### Block registry

```bash
lessonkit blocks list
lessonkit blocks list --json
lessonkit blocks list --category assessment --tier B
```

Reads `@lessonkit/react/block-catalog.v3.json`. JSON output includes `h5pMachineName` where mapped (traceability only — not H5P import).

## Programmatic API (`@lessonkit/lxpack`)

```ts
import {
  exportLkcourse,
  validateLkcourse,
  importLkcourse,
  extractBlockTree,
} from "@lessonkit/lxpack";

const exported = await exportLkcourse({
  projectRoot: "/path/to/course",
  manifest, // parsed LessonkitManifest
  includeBlockTree: true,
});

const check = validateLkcourse("/path/to/course.lkcourse");
if (!check.ok) throw new Error(check.issues.map((i) => i.message).join("; "));

const restored = await importLkcourse({
  archivePath: "/path/to/course.lkcourse",
  targetDir: "/path/to/restored",
});
// Writes lessonkit.json + dist/ only (no src/)
```

## Import scope (1.6.0)

`importLkcourse()` restores:

- `lessonkit.json` from `sourceManifest`
- `dist/**` from the archive

It does **not** restore React `src/`. Re-attach source from version control or a separate project checkout after import.

## Round-trip guarantee

Export embeds the full author manifest in the envelope. Import writes it back verbatim (validated by integration tests against `examples/lxpack-golden`).

## See also

- [Manifest reference](reference/manifest.md)
- [Packaging reference](reference/packaging.md)
- [CLI reference](reference/cli.md)
- [Migration 1.5 → 1.6](../MIGRATION-1.5-to-1.6)
