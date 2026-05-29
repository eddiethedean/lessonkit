# LessonKit examples

[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/examples/index.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../LICENSE)

Runnable Vite + React courses demonstrating **different e-learning patterns** with `@lessonkit/react`.

Browse **[live compiled demos](https://lessonkit.readthedocs.io/en/latest/examples/index.html)** on Read the Docs (built from this folder on each docs deploy).

| Directory | Course | UX pattern |
| --- | --- | --- |
| `react-vite/` | Cybersecurity Awareness (InfoSec) | Dark SOC portal · tab nav · inbox + SMS + Teams scenarios |
| `data-privacy/` | Data Privacy & GDPR Essentials | Light compliance · **sidebar outline** · lawful-basis + tabletop ordering |
| `customer-service/` | Customer Care: De-escalation | Light contact center · **vertical stepper** · chat bubbles + voice script |
| `lxpack-golden/` | Workplace Safety: Warehouse Briefing | Compact field guide · **progress bar** · PPE sign-off + near-miss form |

## Run locally

```bash
npm install
npm run build:packages
npm -w lessonkit-example-react-vite run dev
```

Swap the workspace name for any example. See the [React quickstart](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html) and [packaging guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html).

## Docs embeds

```bash
bash docs/scripts/build-docs-demos.sh
```

Then open [examples on Read the Docs](https://lessonkit.readthedocs.io/en/latest/examples/index.html) or build Sphinx locally per [docs/README.md](../docs/README.md).
