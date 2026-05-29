# LessonKit examples

Runnable Vite + React courses that demonstrate realistic e-learning patterns with `@lessonkit/react`.

| Directory | Course | Use case |
| --- | --- | --- |
| `react-vite/` | Cybersecurity Awareness for Employees | Phishing triage, social engineering, quizzes, progress |
| `data-privacy/` | Data Privacy Essentials | Case studies, data minimization, incident response |
| `customer-service/` | Customer De-escalation Skills | Listening, empathy, branching resolve/escalate |
| `lxpack-golden/` | Workplace Safety: Warehouse Briefing | Shorter flow + `lessonkit pack` / SCORM smoke tests |

## Run locally

```bash
npm install
npm run build:packages
npm -w lessonkit-example-react-vite run dev
```

Swap the workspace name for any example (`lessonkit-example-data-privacy`, `lessonkit-example-customer-service`, `lessonkit-example-lxpack-golden`).

## Docs embeds

Production builds for Read the Docs live under `docs/_static/demos/` (generated, not committed):

```bash
bash docs/scripts/build-docs-demos.sh
```

See [docs/examples/index.md](../docs/examples/index.md) in the Sphinx site.
