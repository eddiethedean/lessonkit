# Getting started in 5 minutes

:::{admonition} No clone required
:class: tip

This guide uses **npm only**. You do not need the LessonKit GitHub monorepo unless you are [contributing](contributing-to-the-monorepo.md) or running [examples](../../examples/index.md).
:::

:::{admonition} First LMS export vs production
:class: note

This guide gets you from zero to a SCORM zip in about five minutes. For learner-facing production, also complete the [production checklist](production-checklist.md) (proxy URLs, observability hooks, LMS bridge).
:::

**Prerequisites:** Node.js **18+** minimum; **20.19+** recommended (CLI scaffold uses Vite 8).

## 1. Create a project

```bash
npx @lessonkit/cli init my-course
cd my-course
```

`init` runs `npm install` by default and writes `lessonkit.json`, `src/courseConfig.ts`, and a starter `src/App.tsx`.

## 2. Preview locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The starter template uses console telemetry sinks in development; see [Production runtime for LMS](#production-runtime-for-lms) before learners open a packaged course.

Alternative: `npx lessonkit dev` (same as the `dev` script).

## 3. Change one quiz

:::{admonition} Edit React and lessonkit.json together
:class: warning

Packaging validates that `courseId`, `lessonId`, and every `checkId` in React appear in **`lessonkit.json`**. Change both files in the same edit—mismatches are the most common `lessonkit package` failure. See [Keep React IDs in sync](quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).
:::

Edit `src/App.tsx` and `lessonkit.json` together:

- In React: update a `Quiz` `question`, `choices`, or `answer`.
- In `lessonkit.json`: update the matching `assessments[]` entry (`checkId`, `question`, `choices`, `answer`).

`lessonkit init` already aligned `courseId` and the first assessment—keep that pattern when you add lessons or checks. See [Keep React IDs in sync with lessonkit.json](quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).

## 4. Production build

:::{admonition} Build vs preview
:class: note

`npm run build` compiles your SPA to `dist/` and usually succeeds even before production telemetry is wired. **`vite preview`** or opening the packaged course in an LMS runs production mode—see [Production runtime for LMS](#production-runtime-for-lms).
:::

```bash
npm run build
```

Output goes to `dist/` (Vite SPA).

(prepare-for-lms)=
## 5. Prepare for LMS packaging

Before SCORM/xAPI/cmi5 export, enable the LMS bridge so completions and scores reach the parent frame:

In `src/courseConfig.ts`, set:

```ts
lxpack: { bridge: "auto" },
```

The init template defaults to `"off"` for local standalone preview. Details: [LXPack bridge reference](../../reference/lxpack-bridge.md).

(production-runtime-for-lms)=
### Production runtime for LMS

Packaged courses run in **production** mode. The init template expects proxy URLs when `import.meta.env.PROD` is true:

1. Copy `.env.example` to `.env` and set `VITE_ANALYTICS_URL` and `VITE_XAPI_PROXY_URL` to your backend proxies (never embed LRS passwords in the bundle).
2. Re-run `npm run build` before packaging so Vite inlines those values.

**First export only (no analytics yet):** temporarily disable delivery in `courseConfig.ts`:

```ts
tracking: { enabled: false },
xapi: { enabled: false },
```

Re-enable and wire real transports before go-live—see the [production checklist](production-checklist.md).

(package-for-your-lms)=
## 6. Package for your LMS

```bash
npm run package:scorm12
```

Or:

```bash
npx lessonkit package --target scorm12
```

The CLI prints the resolved path, for example: `Packaged scorm12 → …/course-scorm12.zip`.

:::{admonition} Your SCORM zip is here
:class: tip

After a successful `package:scorm12` run, upload the ZIP path the CLI prints. Default (relative to your project root):

**`.lxpack/course/.lxpack/out/course-scorm12.zip`**

Other targets use the same folder (for example `course-xapi.zip`, `course-cmi5.zip`). Standalone export writes **`.lxpack/course/.lxpack/out/standalone/`**.
:::

### Where the SCORM zip lands

By default, `lessonkit.json` sets:

```json
"paths": {
  "lxpackOutDir": ".lxpack/course",
  "outputBaseDir": ".lxpack/out"
}
```

`outputBaseDir` is resolved **inside** `lxpackOutDir`, not at the project root:

```text
my-course/
├── lessonkit.json
├── dist/                                    ← Vite build
└── .lxpack/course/                          ← paths.lxpackOutDir
    └── .lxpack/out/                         ← paths.outputBaseDir
        ├── course-scorm12.zip               ← upload this
        ├── course-xapi.zip
        └── standalone/                      ← standalone target
```

Trust **`lessonkit package` stdout** if your paths differ. Override with `--out path/to/custom.zip` (must stay inside the project directory).

## Next steps

- [Quickstart](quickstart.md) — add LessonKit to an existing Vite app
- [Production checklist](production-checklist.md) — observability hooks, transport timeouts, LMS bridge
- [Packaging and CLI](packaging-and-cli.md) — all `--target` values
- [Troubleshooting](troubleshooting.md) — packaging paths, production guard, ID parity
- [Glossary](../../reference/glossary.md) — LXPack, IDs, catalogs
- [Live examples](../../examples/index.md) — full demo courses
