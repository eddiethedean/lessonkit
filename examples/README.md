# LessonKit examples

Runnable Vite + React courses demonstrating **different e-learning patterns** with `@lessonkit/react`.

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

Swap the workspace name for any example.

## Docs embeds

```bash
bash docs/scripts/build-docs-demos.sh
```

See the [live examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html) on Read the Docs.
