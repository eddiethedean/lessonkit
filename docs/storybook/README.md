# Storybook

Interactive component gallery for `@lessonkit/react`.

## Commands

From repo root:

```bash
npm run storybook           # dev server at http://localhost:6006
npm run build-storybook     # static export → packages/react/storybook-static/
```

CI runs `build-storybook` on every PR. Published gallery: [GitHub Pages](https://eddiethedean.github.io/lessonkit/storybook/).

## Story files

| File | Storybook group | Blocks / scenarios |
| --- | --- | --- |
| `CourseLesson.stories.tsx` | Components/CourseLesson | `Course`, `Lesson`, multi-lesson navigation |
| `Quiz.stories.tsx` | Components/Quiz | `Quiz` — unanswered, incorrect, correct |
| `TrueFalse.stories.tsx` | Components/TrueFalse | `TrueFalse` |
| `Blocks.stories.tsx` | Components/Blocks | `Scenario`, `Reflection`, `KnowledgeCheck` |
| `CompoundBlocks.stories.tsx` | Components/Compound & Tier C/D | `InteractiveBook`, `SlideDeck`, `InteractiveVideo`, `BranchingScenario`, `Embed`, `Chart`, `Accordion`, `Summary`, `MemoryGame`, `Video`, `Text`, `Heading`, `TrueFalse` in compound context |

Config: `packages/react/.storybook/`. Stories disable telemetry via `storyConfig` helpers in `stories/helpers.tsx`.

## When to use Storybook vs docs

| Need | Use |
| --- | --- |
| Visual states and keyboard behavior | Storybook |
| Props contract and manifest mapping | [Block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html) |
| Copy-paste React + JSON pairs | [Block cookbook](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/block-cookbook.html) |

Linked from [components & hooks guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html).
