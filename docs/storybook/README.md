# Storybook

Interactive component gallery for `@lessonkit/react`.

## Commands

From repo root:

```bash
npm run storybook           # dev server
npm run build-storybook     # static export → packages/react/storybook-static/
```

CI runs `build-storybook` on every PR.

## Stories

| Group | Covers |
| --- | --- |
| Layouts | Course/Lesson shells, progress tracker |
| Quiz | Unanswered, correct, incorrect states |
| Blocks | Scenario, Reflection, KnowledgeCheck |

Config: `packages/react/.storybook/`. Stories disable telemetry via `storyConfig` helpers.

Linked from [components & hooks guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html).
