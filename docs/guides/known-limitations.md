# Known limitations

Honest scope boundaries for LessonKit **1.7.x**. Use this page when evaluating fit or debugging “why doesn’t LessonKit do X?”

## LMS packaging and layout

| Limitation | Details |
| --- | --- |
| **`single-spa` only** | `lessonkit package` expects `course.layout: "single-spa"` — one Vite SPA for the full course. `per-lesson-spa` is not supported in 1.x packaging. |
| **Production guard** | Packaged courses run in production mode. Console-only telemetry/xAPI sinks, missing proxy URLs, and missing observability hooks cause throws or blank LMS iframes. Dev preview (`npm run dev`) is not representative. See [LMS Go-Live](react-developers/lms-go-live.md). |
| **Bridge allowlist** | Production builds with `lxpack.bridge: "auto"` require `allowedParentOrigins`. Development builds do not — a common “works locally, blank in LMS” trap. |

## Assessments and authoring

| Limitation | Details |
| --- | --- |
| **Assessments inside `<Lesson>`** | Assessment blocks outside `<Lesson>` show an alert in production and skip telemetry/xAPI. |
| **ID parity** | `courseId`, every `lessonId`, and every `checkId` must match between React and `lessonkit.json`. `lessonkit package` fails on mismatches — AI-assisted edits are a frequent source. See [Keep React IDs in sync](react-developers/quickstart.md#keep-react-ids-in-sync-with-lessonkitjson). |
| **Exact answer strings** | MCQ scoring compares learner selection to the exact `answer` string in props/manifest — not fuzzy matching. |

## H5P and content import

| Limitation | Details |
| --- | --- |
| **No `.h5p` import** | LessonKit does not import H5P packages, embed H5P runtime, or integrate with H5P Hub. Rebuild activities as native React blocks. |
| **Pattern reference only** | The [H5P capability map](../project/h5p-capability-map.md) maps familiar H5P types to LessonKit components — it is not an import path. |

## Plugins and marketplace

| Limitation | Details |
| --- | --- |
| **Plugin API scope** | Framework plugins cover telemetry, lifecycle, assessment scoring, and interaction hooks documented in [Plugins reference](../reference/plugins.md). There is no general “drop any npm package into the course shell” marketplace in 1.x. |
| **Marketplace research** | [Plugin marketplace research](plugin-marketplace-research.md) is maintainer-facing — not a shipped product feature. |

## Tooling and examples

| Limitation | Details |
| --- | --- |
| **Monorepo examples** | Folders under `examples/` in the GitHub repo use `file:../../packages/*` — for contributors only. External courses should use npm `@lessonkit/*` versions. |
| **TypeDoc vs guides** | Generated API docs list signatures; runtime behavior and error conditions live in narrative guides first. See [API reference](../reference/api.md). |

## Related

- [FAQ](faq.md) · [Troubleshooting hub](troubleshooting.md)
- [LMS compatibility](../reference/lms-compatibility.md)
- [Coming from H5P?](h5p-for-lessonkit-authors.md)
