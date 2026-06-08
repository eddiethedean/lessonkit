# DragTheWords

:::{admonition} H5P equivalent
:class: tip

**H5P Drag the Words** — learners drag labels from a bank into blanks in a sentence.
:::

## When to use

Use `DragTheWords` when typing is awkward but you still want **sentence-level context** — assembling the correct action phrase, ordering verbs, or placing domain terms.

Mark drop zones with `*` in `template`. Include distractors in `words` that are not used.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-drag-the-words

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/drag-the-words"
  title="DragTheWords component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/drag-the-words" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-drag-the-words

```tsx
<DragTheWords
  checkId="action-dtw"
  template="When mail looks suspicious, use *Report phishing* instead of *forwarding* it to colleagues."
  words={["Report phishing", "forwarding", "Reply all", "Archive"]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-drag-the-words

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a DragTheWords block (H5P-style: Drag the Words) like this example inside the active <Lesson>:

<DragTheWords
  checkId="action-dtw"
  template="When mail looks suspicious, use *Report phishing* instead of *forwarding* it to colleagues."
  words={["Report phishing", "forwarding", "Reply all", "Archive"]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "action-dtw",
  "kind": "dragTheWords",
  "question": "Use Report phishing instead of forwarding suspicious mail.",
  "zones": ["Report phishing"]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync-group: component-drag-the-words

Add under `course.assessments[]`:

```json
{
  "checkId": "action-dtw",
  "kind": "dragTheWords",
  "question": "Use Report phishing instead of forwarding suspicious mail.",
  "zones": ["Report phishing"]
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [Block catalog](../block-catalog.md)
- [Block cookbook — DragTheWords](../../guides/react-developers/block-cookbook.md#dragthewords)
