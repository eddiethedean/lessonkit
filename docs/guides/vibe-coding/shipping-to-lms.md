# Shipping to an LMS

Packaging turns your preview app into a file your LMS can import.

## Requirements

- **Node.js 18+** for `lessonkit package`
- A finished course that passes `lessonkit build`
- Your LMS admin’s target format (often **SCORM 1.2**)

## Before you package

1. **LMS bridge** — In `src/courseConfig.ts`, set `lxpack: { bridge: "auto", allowedParentOrigins: ["https://your-lms.example"] }` so scores and completions reach the LMS. Production requires the allowlist; the init template uses `"off"` for local preview.
2. **Production runtime** — Copy `.env.example` to `.env`, set `VITE_ANALYTICS_URL` and `VITE_XAPI_PROXY_URL`, then rebuild—or temporarily set `tracking: { enabled: false }` and `xapi: { enabled: false }` for a first test export only. See [LMS Go-Live](../react-developers/lms-go-live.md).

## Steps

```bash
cd my-phishing-course
lessonkit build
lessonkit package --target scorm12
```

The CLI prints the output path (default: **`.lxpack/course/.lxpack/out/course-scorm12.zip`** relative to your project root).

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

1. The generated **ZIP** (SCORM) or folder (standalone)—use the path the CLI prints
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

More detail: [Packaging reference](../../reference/packaging.md) · [Troubleshooting](troubleshooting.md)
