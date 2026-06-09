# First LMS export

:::{admonition} Appendix — read LMS Go-Live first
:class: note

This page is a **shortcut checklist** only. For the full smoke-test vs production decision tree, SCORM path diagram, and troubleshooting links, start with **[LMS Go-Live](lms-go-live.md)**.
:::

Export your course to SCORM (or other LMS targets) after you have a working local preview. For the fastest local start, complete [Getting started in 5 minutes](getting-started-in-5-minutes.md) first.

**Prerequisites:** A project from `lessonkit init` with `npm run dev` working. Node.js: [Prerequisites — decision table](../prerequisites.md#node-js-and-npm).

## Checklist

- [ ] `src/courseConfig.ts` — `lxpack.bridge: "auto"` and `allowedParentOrigins` set
- [ ] `.env` — `VITE_ANALYTICS_URL` and `VITE_XAPI_PROXY_URL` **or** tracking/xAPI disabled for smoke test only
- [ ] `npm run build` succeeded (`dist/` exists)
- [ ] `lessonkit.json` IDs match React `courseId`, `lessonId`, and `checkId` values
- [ ] `npm run package:scorm12` (or your target) — note the ZIP path the CLI prints

## 1. Prepare for LMS packaging

Before SCORM/xAPI/cmi5 export, enable the LMS bridge so completions and scores reach the parent frame.

In `src/courseConfig.ts`, set:

```ts
lxpack: {
  bridge: "auto",
  allowedParentOrigins: ["https://your-lms.example"],
},
```

The init template defaults to `"off"` for local standalone preview. Details: [LXPack bridge reference](../../reference/lxpack-bridge.md).

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

## 2. Package for your LMS

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

After a successful `package:scorm12` run, upload the ZIP path the CLI prints. Default path: see [FAQ — SCORM zip location](../faq.md#where-is-my-scorm-zip-after-packaging) (canonical reference for all targets).
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

- **[LMS Go-Live](lms-go-live.md)** — canonical guide (return here for production branch)
- [Production checklist](production-checklist.md) — observability hooks, transport timeouts (appendix)
- [Deployment guide](deployment-guide.md) — SCORM vs standalone vs xAPI matrix
- [Troubleshooting](troubleshooting.md) — packaging paths, bridge allowlist, ID parity
- [Packaging and CLI](packaging-and-cli.md) — all `--target` values
