# Accordion

:::{admonition} H5P equivalent
:class: tip

**H5P Accordion** — expandable sections for reference material or optional depth.
:::

## When to use

Use `Accordion` to **collapse supporting detail** — policy excerpts, FAQ entries, or glossary-style content without overwhelming the main lesson flow.

Each section has an `id`, `title`, and `content` (React node). Keyboard support follows WAI-ARIA accordion patterns.

Often paired inside [`SlideDeck`](slide-deck.md) slides or [`Page`](../block-catalog.md) blocks in an [`InteractiveBook`](interactive-book.md).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-accordion

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/accordion"
  title="Accordion component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/accordion" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-accordion

```tsx
<Accordion
  blockId="policy-accordion"
  sections={[
    {
      id: "reporting",
      title: "Reporting phishing",
      content: <Text>Use Report phishing in your mail client.</Text>,
    },
    {
      id: "devices",
      title: "Devices and access",
      content: <Text>Lock your screen and never approve MFA you did not initiate.</Text>,
    },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-accordion

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Accordion block (H5P-style: Accordion) like this example inside the active <Lesson>:

<Accordion
  blockId="policy-accordion"
  sections={[
    {
      id: "reporting",
      title: "Reporting phishing",
      content: <Text>Use Report phishing in your mail client.</Text>,
    },
    {
      id: "devices",
      title: "Devices and access",
      content: <Text>Lock your screen and never approve MFA you did not initiate.</Text>,
    },
  ]}
/>

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

- [Block catalog — Accordion](../block-catalog.md)
- [framework-12-showcase example](../../examples/index.md#framework-12-showcase-examplesframework-12-showcase)
