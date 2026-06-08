# DialogCards

:::{admonition} H5P equivalent
:class: tip

**H5P Dialog Cards**
:::

## When to use

Use `DialogCards` for **phrasebook-style** content — common questions and approved responses, studied one card at a time with prev/next navigation.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-dialog-cards

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/dialog-cards"
  title="DialogCards component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/dialog-cards" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-dialog-cards

```tsx
<DialogCards
  blockId="phrase-cards"
  cards={[
    {
      front: "A colleague asks for your MFA code.",
      back: "Never share MFA codes. Walk them to the help desk instead.",
    },
    { front: "How do I report phishing?", back: "Use Report message — do not forward." },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-dialog-cards

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a DialogCards block (H5P-style: Dialog Cards) like this example inside the active <Lesson>:

<DialogCards
  blockId="phrase-cards"
  cards={[
    {
      front: "A colleague asks for your MFA code.",
      back: "Never share MFA codes. Walk them to the help desk instead.",
    },
    { front: "How do I report phishing?", back: "Use Report message — do not forward." },
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

- [Flashcards](flashcards.md)
