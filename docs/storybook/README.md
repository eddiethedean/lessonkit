# Storybook

[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Component gallery for `@lessonkit/react`, linked from the [components & hooks guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html).

## Run locally

From the monorepo root:

```bash
npm run storybook
```

Build a static export (also run in CI):

```bash
npm run build-storybook
```

Output: `packages/react/storybook-static/`.

## Stories

| Group | File | Covers |
|-------|------|--------|
| Layouts | `packages/react/stories/CourseLesson.stories.tsx` | Course/Lesson shells, progress tracker |
| Quiz | `packages/react/stories/Quiz.stories.tsx` | Unanswered, correct, incorrect states |
| Blocks | `packages/react/stories/Blocks.stories.tsx` | Scenario, Reflection, KnowledgeCheck |

Configuration: `packages/react/.storybook/`. Telemetry is disabled in stories via `storyConfig` helpers.
