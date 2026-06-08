# WordSearch

:::{admonition} H5P equivalent
:class: tip

**H5P Find the words**
:::

## When to use

Use `WordSearch` for **hidden-word discovery** in a letter grid. Words are placed horizontally; learners select letters to match targets.

## Requirements

- `words` are uppercased internally; keep lengths ≤ `size` (default 10).
- Keyboard-first selection patterns documented in block catalog a11y notes.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-word-search

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/word-search"
  title="WordSearch component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/word-search" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-word-search

```tsx
<WordSearch checkId="policy-ws" words={["PHISH", "MFA", "VPN"]} size={8} />
```
:::

:::{tab-item} AI prompt
:sync: component-word-search

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a WordSearch block (H5P-style: Find the words) like this example inside the active <Lesson>:

<WordSearch checkId="policy-ws" words={["PHISH", "MFA", "VPN"]} size={8} />

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "policy-ws",
  "kind": "wordSearch",
  "question": "Find the security terms.",
  "words": ["PHISH", "MFA"]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-word-search

Add under `course.assessments[]`:

```json
{
  "checkId": "policy-ws",
  "kind": "wordSearch",
  "question": "Find the security terms.",
  "words": ["PHISH", "MFA"]
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [Crossword](crossword.md)
