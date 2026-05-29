# Live examples

These pages embed **production builds** of the monorepo examples, compiled when the documentation site is built (CI and Read the Docs). Open your browser developer console to see telemetry and xAPI log output.

:::{admonition} Local preview
:class: tip

From the repo root, run `bash docs/scripts/build-docs-demos.sh` before `make html` in `docs/` so the bundles exist under `_static/demos/`.
:::

## Cybersecurity awareness (`examples/react-vite`)

Annual-style security training: phishing inbox triage, urgent-request social engineering, credential hygiene, and a short assessment.

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/react-vite/index.html"
  title="Cybersecurity awareness training demo"
  loading="lazy"
></iframe>
```

[Open in full tab](../_static/demos/react-vite/index.html) · [Source on GitHub](https://github.com/eddiethedean/lessonkit/tree/main/examples/react-vite)

## Data privacy essentials (`examples/data-privacy`)

Compliance onboarding: case studies, data minimization on a registration form, and incident-response steps.

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/data-privacy/index.html"
  title="Data privacy essentials training demo"
  loading="lazy"
></iframe>
```

[Open in full tab](../_static/demos/data-privacy/index.html) · [Source on GitHub](https://github.com/eddiethedean/lessonkit/tree/main/examples/data-privacy)

## Customer de-escalation (`examples/customer-service`)

Frontline support skills: reflective listening, empathy phrasing, and branching resolve-or-escalate practice.

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/customer-service/index.html"
  title="Customer de-escalation training demo"
  loading="lazy"
></iframe>
```

[Open in full tab](../_static/demos/customer-service/index.html) · [Source on GitHub](https://github.com/eddiethedean/lessonkit/tree/main/examples/customer-service)

## Workplace safety briefing (`examples/lxpack-golden`)

Warehouse safety course used for LXPack packaging smoke tests—same runtime, shorter three-step flow.

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/lxpack-golden/index.html"
  title="Workplace safety briefing demo"
  loading="lazy"
></iframe>
```

[Open in full tab](../_static/demos/lxpack-golden/index.html) · [Source on GitHub](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden)

## Run examples locally

```bash
npm install
npm run build:packages
npm -w lessonkit-example-react-vite run dev
npm -w lessonkit-example-data-privacy run dev
npm -w lessonkit-example-customer-service run dev
npm -w lessonkit-example-lxpack-golden run dev
```

Packaging walkthrough: [Packaging and CLI](../guides/react-developers/packaging-and-cli.md).
