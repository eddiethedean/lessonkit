# Crossword

:::{admonition} H5P equivalent
:class: tip

**H5P Crossword**
:::

## When to use

Use `Crossword` for **grid-based vocabulary** challenges. Define `entries` with clues, answers, grid positions, and `across`/`down` direction.

## Requirements

- `rows` and `cols` bound the grid.
- Entries must fit without conflicting letters.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-crossword

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/crossword"
  title="Crossword component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/crossword" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-crossword

```tsx
<Crossword
  checkId="security-crossword"
  rows={4}
  cols={3}
  entries={[
    { id: "a1", clue: "Two-step login, for short (3 letters)", answer: "MFA", row: 1, col: 0, direction: "across" },
    { id: "d1", clue: "How apps talk to servers, for short (3 letters)", answer: "API", row: 1, col: 2, direction: "down" },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-crossword

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Crossword block (H5P-style: Crossword) like this example inside the active <Lesson>:

<Crossword
  checkId="security-crossword"
  rows={4}
  cols={3}
  entries={[
    { id: "a1", clue: "Two-step login, for short (3 letters)", answer: "MFA", row: 1, col: 0, direction: "across" },
    { id: "d1", clue: "How apps talk to servers, for short (3 letters)", answer: "API", row: 1, col: 2, direction: "down" },
  ]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "security-crossword",
  "kind": "crossword",
  "question": "Complete the security crossword."
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-crossword

Add under `course.assessments[]`:

```json
{
  "checkId": "security-crossword",
  "kind": "crossword",
  "question": "Complete the security crossword."
}
```
:::

::::
<!-- try-it:end -->




















## See also

- [WordSearch](word-search.md)
