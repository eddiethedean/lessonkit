# Troubleshooting

Single entry point for common LessonKit issues. Pick your path below—detailed runbooks live on the linked pages.

## Quick decision tree

| If you see… | Start here |
| --- | --- |
| `npx @lessonkit/cli init` fails or Vite errors on Node 18 | [Node version errors](react-developers/troubleshooting.md#node-version-errors) · [Prerequisites](prerequisites.md) |
| `lessonkit: command not found` | [CLI not found](react-developers/troubleshooting.md#lessonkit-command-not-found) |
| `npm install` fails during `init` | [npm install failures](react-developers/troubleshooting.md#npm-install-failures) |
| SCORM zip not where expected | [FAQ — SCORM path](faq.md#where-is-my-scorm-zip-after-packaging) |
| `lessonkit package` ID / manifest errors | [ID parity](react-developers/troubleshooting.md#lessonkit-package-fails-on-id-parity) |
| Blank page or throw after LMS upload | [Production build throws](react-developers/troubleshooting.md#production-build-or-packaged-course-throws-on-load) |
| LMS shows no completion/score | [SCORM runs but no completion](react-developers/troubleshooting.md#scorm-runs-but-lms-shows-no-completion-or-score) |
| Analytics/xAPI 401, 403, or CORS | [CORS and proxy errors](react-developers/troubleshooting.md#cors-and-proxy-errors) |
| AI edits broke the course / blank dev page | [Vibe coding troubleshooting](vibe-coding/troubleshooting.md) |
| Quiz won't complete after AI edit | [Vibe coding — quiz](vibe-coding/troubleshooting.md#quiz-does-not-mark-complete) |

## By audience

| Audience | Guide |
| --- | --- |
| **React developers** | [Troubleshooting (React developers)](react-developers/troubleshooting.md) — packaging, production builds, LMS delivery, observability |
| **Vibe coding / AI-assisted** | [Troubleshooting (vibe coding)](vibe-coding/troubleshooting.md) — symptom table, AI prompts, links to React runbooks |
| **Everyone** | [FAQ](faq.md) — quick answers on adoption, Node versions, H5P comparison, tracking defaults |

## Related guides

- [First LMS export](react-developers/first-lms-export.md) — bridge, env vars, SCORM packaging
- [Production checklist](react-developers/production-checklist.md) — pre-ship verification
- [Ship to LMS](react-developers/ship-to-lms.md) — one-page go-live checklist

```{toctree}
:hidden:
:maxdepth: 1

react-developers/troubleshooting
vibe-coding/troubleshooting
```
