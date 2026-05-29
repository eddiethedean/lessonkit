# Live examples

These pages embed **production builds** of the monorepo examples, compiled when the documentation site is built (CI and Read the Docs). Open your browser developer console to see telemetry and xAPI log output.

:::{admonition} Local preview
:class: tip

From the repo root, run `bash docs/scripts/build-docs-demos.sh` before `make html` in `docs/` so the bundles exist under `_static/demos/`.
:::

## Cybersecurity awareness (`examples/react-vite`)

Corporate InfoSec annual module: policy attestation, email header triage, smishing simulation, Teams social engineering, and attestation.

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

GDPR compliance track with sidebar outline: lawful-basis lab, audit case files, role-based minimization, and incident tabletop.

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

Contact-center training with stepper UI: channel briefing, chat bubbles, voice pacing, and branching resolution paths.

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

Warehouse new-hire briefing with progress bar, PPE sign-off, photo hazard walk, quiz, and practice near-miss form (LXPack smoke test).

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
