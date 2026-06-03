# Components and hooks

:::{admonition} H5P equivalents
:class: tip

| LessonKit | H5P |
| --- | --- |
| `Quiz` / `KnowledgeCheck` | Multiple Choice |
| `Scenario` | Scenario / narrative block |
| `Reflection` | Open response (manual scoring) |

More types (`FillInTheBlanks`, `InteractiveVideo`, …) are on the roadmap. See **[Coming from H5P?](../h5p-for-lessonkit-authors.md)** and the **[capability map](../../project/h5p-capability-map.md)**.
:::

Canonical block list, props, and contracts: [Block catalog reference](../../reference/block-catalog.md).

## Components

| Component | Required props | Role |
| --- | --- | --- |
| `Course` | `title`, `courseId` | Wraps provider; course shell |
| `Lesson` | `title`, `lessonId` | Lesson lifecycle (start/complete on mount/unmount) |
| `Scenario` | — | Semantic scenario region |
| `Quiz` / `KnowledgeCheck` | `checkId`, `question`, `choices`, `answer` | Assessment + telemetry |
| `Reflection` | optional `prompt`, `blockId` | Textarea reflection block |
| `ProgressTracker` | — | Shows completed lesson count |

`Course` accepts `config` for tracking/xAPI and optional `sinks` (same shape as `LessonkitProvider`).

## Storybook

Run the component gallery from the monorepo:

```bash
npm run storybook
```

See [Storybook](https://github.com/eddiethedean/lessonkit/tree/main/packages/react/storybook) for story groups (Course/Lesson layouts, Quiz states, blocks).

## Hooks

| Hook | Returns |
| --- | --- |
| `useLessonkit()` | Full runtime (throws outside provider) |
| `useProgress()` | `progress` state |
| `useTracking()` | `{ track }` |
| `useQuizState()` | `{ answer, complete }` — requires `checkId` in payloads |
| `useCompletion()` | `{ completeLesson, completeCourse }` |
| `useTheme()` | Theme context from `ThemeProvider` |

## Lesson lifecycle

`Lesson` calls `setActiveLesson` on mount and `completeLesson` on unmount. SPA navigation that **unmounts** lessons emits completion and time-on-task events—design navigation accordingly (see `examples/react-vite`).

## Custom interactions

```tsx
const { track } = useTracking();

track("interaction", { kind: "branch_choice", branch: "verify" });
```

Use discriminated `data` shapes per [Telemetry reference](../../reference/telemetry.md).

## Provider-only usage

```tsx
<LessonkitProvider config={{ courseId: "my-course", tracking: { sink } }}>
  {/* custom tree */}
</LessonkitProvider>
```

Package README: [`@lessonkit/react` on GitHub](https://github.com/eddiethedean/lessonkit/tree/main/packages/react).
