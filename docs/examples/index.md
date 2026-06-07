# Live examples

These pages embed **production builds** of the monorepo examples, compiled when the documentation site is built (CI and Read the Docs). Each course uses the same modern LMS layout (sidebar curriculum, progress ring, lesson cards) with a different color theme and scenario content.

:::{admonition} Demo telemetry — not for production
:class: warning

Embedded demos and monorepo examples log telemetry/xAPI to the **browser console** for illustration (`examples/_shared/docsDemoConfig.ts`). **Do not copy that pattern for production.**

For LMS go-live, use the CLI template **`src/courseConfig.ts`** from `npx @lessonkit/cli init` and complete the [production checklist](../guides/react-developers/production-checklist.md) (proxy URLs, observability hooks, `lxpack.bridge` allowlist).
:::

:::{admonition} Local preview
:class: tip

From the repo root, run `bash docs/scripts/build-docs-demos.sh` before `make html` in `docs/` so the bundles exist under `_static/demos/`.
:::

## Example picker

| Example | Embedded on RTD | npm workspace | Framework | Start here when |
| --- | --- | --- | --- | --- |
| [react-vite](#cybersecurity-awareness-examplesreact-vite) | Yes | `lessonkit-example-react-vite` | 1.x UX | First full course / monorepo smoke |
| [framework-11-showcase](#framework-11-showcase-examplesframework-11-showcase) | Yes | `lessonkit-example-framework-11-showcase` | 1.1 blocks | P0 assessments catalog |
| [framework-12-showcase](#framework-12-showcase-examplesframework-12-showcase) | Yes | `lessonkit-example-framework-12-showcase` | 1.2 blocks | Content + compound + Tier C/D |
| [data-privacy](#data-privacy-essentials-examplesdata-privacy) | Yes | `lessonkit-example-data-privacy` | 1.x | Compliance-themed course |
| [customer-service](#customer-de-escalation-examplescustomer-service) | Yes | `lessonkit-example-customer-service` | 1.5 branching | Support + branching scenario |
| [lxpack-golden](#workplace-safety-briefing-exampleslxpack-golden) | Yes | `lessonkit-example-lxpack-golden` | Packaging | SCORM/xAPI export reference |
| [slide-deck](#slide-deck-examplesslide-deck) | No | `lessonkit-example-slide-deck` | 1.3 | `SlideDeck` compound |
| [interactive-book](#interactive-book-examplesinteractive-book) | No | `lessonkit-example-interactive-book` | 1.2 | `InteractiveBook` compound |
| [assessments-p0](#assessment-showcase-examplesassessments-p0) | No | `lessonkit-example-assessments-p0` | 1.1 | Minimal assessment sample |
| interactive-video | No (GitHub) | `lessonkit-example-interactive-video` | 1.4 | `InteractiveVideo` compound |
| branching-scenario | No (GitHub) | `lessonkit-example-branching-scenario` | 1.5 | `BranchingScenario` graph |

**External starter:** `npx @lessonkit/cli init` — not in this table; use for new projects outside the monorepo.

Run locally (after `npm run build:packages`): `npm -w <workspace> run dev`. Full table: [examples/README on GitHub](https://github.com/eddiethedean/lessonkit/blob/main/examples/README.md).

## Cybersecurity awareness (`examples/react-vite`)

Corporate InfoSec annual module in the security theme: policy attestation, email header triage, smishing simulation, Teams social engineering, and attestation.

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/react-vite/index.html"
  title="Cybersecurity awareness training demo"
  loading="lazy"
></iframe>
```

<p class="lk-demo-links">
  <a href="../_static/demos/react-vite/index.html" target="_blank" rel="noopener noreferrer">Open in full tab</a>
  · <a href="https://github.com/eddiethedean/lessonkit/tree/main/examples/react-vite">Source on GitHub</a>
</p>

## Data privacy essentials (`examples/data-privacy`)

GDPR compliance track (compliance theme): lawful-basis lab, audit case files, role-based minimization, and incident tabletop.

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/data-privacy/index.html"
  title="Data privacy essentials training demo"
  loading="lazy"
></iframe>
```

<p class="lk-demo-links">
  <a href="../_static/demos/data-privacy/index.html" target="_blank" rel="noopener noreferrer">Open in full tab</a>
  · <a href="https://github.com/eddiethedean/lessonkit/tree/main/examples/data-privacy">Source on GitHub</a>
</p>

## Customer de-escalation (`examples/customer-service`)

Contact-center training in the support theme: channel briefing, chat bubbles, voice pacing, and branching resolution paths.

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/customer-service/index.html"
  title="Customer de-escalation training demo"
  loading="lazy"
></iframe>
```

<p class="lk-demo-links">
  <a href="../_static/demos/customer-service/index.html" target="_blank" rel="noopener noreferrer">Open in full tab</a>
  · <a href="https://github.com/eddiethedean/lessonkit/tree/main/examples/customer-service">Source on GitHub</a>
</p>

## Workplace safety briefing (`examples/lxpack-golden`)

Warehouse new-hire briefing in the compact field theme: PPE sign-off, photo hazard walk, quiz, and practice near-miss form (LXPack smoke test).

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/lxpack-golden/index.html"
  title="Workplace safety briefing demo"
  loading="lazy"
></iframe>
```

<p class="lk-demo-links">
  <a href="../_static/demos/lxpack-golden/index.html" target="_blank" rel="noopener noreferrer">Open in full tab</a>
  · <a href="https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden">Source on GitHub</a>
</p>

## Framework 1.1 showcase (`examples/framework-11-showcase`)

**Recommended starting point for 1.1.** Incident Response course covering 1.0 foundation blocks (`Scenario`, `Quiz`, `Reflection`, …) and every 1.1 P0 assessment (`TrueFalse` through `AssessmentSequence`). Uses block catalog v2.

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/framework-11-showcase/index.html"
  title="Framework 1.1 showcase demo"
  loading="lazy"
></iframe>
```

<p class="lk-demo-links">
  <a href="../_static/demos/framework-11-showcase/index.html" target="_blank" rel="noopener noreferrer">Open in full tab</a>
  · <a href="https://github.com/eddiethedean/lessonkit/tree/main/examples/framework-11-showcase">Source on GitHub</a>
</p>

## Framework 1.2 showcase (`examples/framework-12-showcase`)

**Recommended starting point for 1.2.** A four-lesson Atlas Analytics course that demonstrates every new block: content (`Text`, `Heading`, `Image`), compound containers (`Page`, `InteractiveBook`, `AssessmentSequence`), Tier C/D presentation, and P0 assessments including `FindHotspot` / `FindMultipleHotspots`.

```{raw} html
<iframe
  class="lk-demo-frame"
  src="../_static/demos/framework-12-showcase/index.html"
  title="Framework 1.2 showcase demo"
  loading="lazy"
></iframe>
```

<p class="lk-demo-links">
  <a href="../_static/demos/framework-12-showcase/index.html" target="_blank" rel="noopener noreferrer">Open in full tab</a>
  · <a href="https://github.com/eddiethedean/lessonkit/tree/main/examples/framework-12-showcase">Source on GitHub</a>
</p>

## Interactive book (`examples/interactive-book`)

Compound `Page` and `InteractiveBook` patterns (framework 1.2). Source-only on this site—run locally from the monorepo.

<p class="lk-demo-links">
  <a href="https://github.com/eddiethedean/lessonkit/tree/main/examples/interactive-book">Source on GitHub</a>
</p>

## Slide deck (`examples/slide-deck`)

**Recommended starting point for 1.3.** Compound `Slide` and `SlideDeck` (H5P Course Presentation): keyboard navigation, deck scoring, and session resume. Source-only on this site—run locally from the monorepo.

<p class="lk-demo-links">
  <a href="https://github.com/eddiethedean/lessonkit/tree/main/examples/slide-deck">Source on GitHub</a>
</p>

## Assessment showcase (`examples/assessments-p0`)

P0 blocks: `TrueFalse`, drag/drop, hotspots, fill-in-blanks, and related types. Source-only on this site.

<p class="lk-demo-links">
  <a href="https://github.com/eddiethedean/lessonkit/tree/main/examples/assessments-p0">Source on GitHub</a>
</p>

## Run examples locally

Requires a clone of the monorepo and **`npm run build:packages`** first (examples use `file:../../packages/*`).

```bash
npm install
npm run build:packages
npm -w lessonkit-example-react-vite run dev
npm -w lessonkit-example-data-privacy run dev
npm -w lessonkit-example-customer-service run dev
npm -w lessonkit-example-lxpack-golden run dev
npm -w lessonkit-example-framework-11-showcase run dev
npm -w lessonkit-example-framework-12-showcase run dev
npm -w lessonkit-example-interactive-book run dev
npm -w lessonkit-example-slide-deck run dev
npm -w lessonkit-example-assessments-p0 run dev
```

Packaging walkthrough: [Packaging and CLI](../guides/react-developers/packaging-and-cli.md). Full index: [examples/README](https://github.com/eddiethedean/lessonkit/blob/main/examples/README.md).
