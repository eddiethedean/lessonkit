# Component gallery (Storybook)

Interactive visual reference for `@lessonkit/react` components—states, keyboard behavior, and compound layouts.

**Published gallery:** [GitHub Pages](https://eddiethedean.github.io/lessonkit/storybook/)

## When to use Storybook vs other docs

| Need | Use |
| --- | --- |
| Live component + when to use it (Read the Docs) | [Component pages](components/index.md) |
| Visual states and keyboard behavior | **Storybook** (this page) |
| Props contract and manifest mapping | [Block catalog](block-catalog.md) |
| Copy-paste React + JSON pairs | [Block cookbook](../guides/react-developers/block-cookbook.md) |
| Hook and provider APIs | [Components & hooks](../guides/react-developers/components-and-hooks.md) · [API reference](api.md) |

## Run locally (monorepo contributors)

From the repo root:

```bash
npm run build:packages
npm run storybook           # http://localhost:6006
npm run build-storybook     # static export → packages/react/storybook-static/
```

Story files live under `packages/react/stories/`. CI builds Storybook on every PR.

## Coverage

Storybook demonstrates core structure (`Course`, `Lesson`, `Quiz`), P0 assessments (`TrueFalse`), and compound blocks (`InteractiveBook`, `SlideDeck`, `InteractiveVideo`, `BranchingScenario`, `Embed`, `Chart`, and others). The full block catalog lists all shipped types—Storybook coverage is expanding. See [Block catalog](block-catalog.md) for the complete list.
