# Shipping to an LMS

Packaging turns your preview app into a file your LMS can import.

## Requirements

- **Node.js 18+** for `lessonkit package`
- A finished course that passes `lessonkit build`
- Your LMS admin’s target format (often **SCORM 1.2**)

## Steps

```bash
cd my-phishing-course
lessonkit build
lessonkit package --target scorm12
```

The CLI prints the output path (typically under `.lxpack/out/`).

## Targets

| `--target` | Typical use |
| --- | --- |
| `scorm12` | Widest LMS compatibility |
| `scorm2004` | Newer SCORM hosts |
| `standalone` | Host as a static site / zip |
| `xapi` | xAPI-enabled LRS workflows |
| `cmi5` | cmi5-capable platforms |

Your admin knows which to request. If unsure, start with **scorm12**.

## What to send your LMS administrator

1. The generated **ZIP** (SCORM) or folder (standalone)
2. Course title and expected duration (your estimate)
3. Note: “Single-SPA LessonKit export; one SCO; navigation inside the package.”

## Prompt for the AI if build fails

```text
lessonkit build failed. Read the terminal error, fix only the files needed,
and explain the fix in plain language. Do not change courseId or lessonIds.
```

## Prompt for packaging errors

```text
lessonkit package --target scorm12 failed.
Compare lessonkit.json assessments checkIds with Quiz checkId props in App.tsx.
Fix mismatches and validate layout is single-spa.
```

More detail: [Packaging reference](../../reference/packaging.md).
