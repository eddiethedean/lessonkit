# Text & Heading

## When to use

Use `Text` and `Heading` for **basic lesson copy** inside compounds or lessons — paragraphs (`Text`) and section titles (`Heading` level 1–3).

These are building blocks inside `Slide`, `Page`, `Scenario`, and other containers rather than standalone lesson types.

## Requirements

- Optional `blockId` for block-level telemetry URNs.
- Prefer a single `h1` from `Course`; use `Heading level={2}` or `3` inside lessons.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-text-and-heading

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/text-and-heading"
  title="Text & Heading component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/text-and-heading" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-text-and-heading

```tsx
<Heading level={2} blockId="section-title">Reporting suspicious mail</Heading>
<Text blockId="section-body">
  Use Report phishing in your mail client. Do not forward the message to colleagues.
</Text>
```
:::

:::{tab-item} AI prompt
:sync-group: component-text-and-heading

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add Text and Heading blocks like this example:

<Heading level={2} blockId="section-title">Reporting suspicious mail</Heading>
<Text blockId="section-body">
  Use Report phishing in your mail client. Do not forward the message to colleagues.
</Text>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

::::
<!-- try-it:end -->
















## See also

- [SlideDeck](slide-deck.md)
- [InteractiveBook](interactive-book.md)
