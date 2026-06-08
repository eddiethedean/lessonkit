# Flashcards

:::{admonition} H5P equivalent
:class: tip

**H5P Flashcards**
:::

## When to use

Use `Flashcards` for **term ↔ definition** study — flip cards one at a time. Optional `selfScore` for learner-rated confidence (not LMS-scored).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-flashcards

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/flashcards"
  title="Flashcards component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/flashcards" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-flashcards

```tsx
<Flashcards
  blockId="security-flashcards"
  cards={[
    { front: "Phishing", back: "Fraudulent messages designed to steal credentials." },
    { front: "MFA", back: "Multi-factor authentication." },
    { front: "SOC", back: "Security operations center for active incidents." },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-flashcards

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Flashcards block (H5P-style: Flashcards) like this example inside the active <Lesson>:

<Flashcards
  blockId="security-flashcards"
  cards={[
    { front: "Phishing", back: "Fraudulent messages designed to steal credentials." },
    { front: "MFA", back: "Multi-factor authentication." },
    { front: "SOC", back: "Security operations center for active incidents." },
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

- [DialogCards](dialog-cards.md) — sequential dialog-style cards
