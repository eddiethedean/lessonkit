# Slide

:::{admonition} H5P equivalent
:class: tip

**H5P Course Presentation (slide)**
:::

## When to use

Use `Slide` as a **child of `SlideDeck`** — one screen in a presentation-style lesson. Combine with `Heading`, `Text`, assessments, or content blocks.

Do not mount `Slide` directly under `Lesson`.

## Requirements

- Each `Slide` needs `blockId` and `title`.
- Keyboard navigation is provided by the parent deck.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-slide

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/slide"
  title="Slide component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/slide" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-slide

```tsx
<SlideDeck blockId="briefing" title="Security briefing">
  <Slide blockId="context" title="Context">
    <Text>Attackers impersonate payroll and shipping during busy seasons.</Text>
  </Slide>
  <Slide blockId="check" title="Check">
    <TrueFalse checkId="slide-tf" question="A familiar display name guarantees legitimacy." answer={false} />
  </Slide>
</SlideDeck>
```
:::

:::{tab-item} AI prompt
:sync: component-slide

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Slide block (H5P-style: Course Presentation (slide)) like this example inside the active <Lesson>:

<SlideDeck blockId="briefing" title="Security briefing">
  <Slide blockId="context" title="Context">
    <Text>Attackers impersonate payroll and shipping during busy seasons.</Text>
  </Slide>
  <Slide blockId="check" title="Check">
    <TrueFalse checkId="slide-tf" question="A familiar display name guarantees legitimacy." answer={false} />
  </Slide>
</SlideDeck>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- Mount only inside the documented parent compound (see component page When to use).
Packaging notes:
`Slide` is a [`SlideDeck`](slide-deck.md) child — no manifest row for the slide itself.
- Stable **`blockId`** per slide helps resume and telemetry URNs.
- Nested assessments need matching `course.assessments[]` entries.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync: component-slide

`Slide` is a [`SlideDeck`](slide-deck.md) child — no manifest row for the slide itself.

- Stable **`blockId`** per slide helps resume and telemetry URNs.
- Nested assessments need matching `course.assessments[]` entries.
:::

::::
<!-- try-it:end -->
















## See also

- [SlideDeck](slide-deck.md)
