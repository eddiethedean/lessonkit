# FillInTheBlanks

:::{admonition} H5P equivalent
:class: tip

**H5P Fill in the Blanks** — learners type answers into inline blanks within a sentence.
:::

## When to use

Use `FillInTheBlanks` when recall works best **in context** — completing a policy sentence, naming a step in a procedure, or spelling a keyword inside a definition.

Wrap correct answers in `*` in the `template` string. LessonKit derives blank specs for packaging when you export.

**Prefer [`DragTheWords`](drag-the-words.md)** when you want learners to pick from a word bank instead of typing.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-fill-in-the-blanks

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/fill-in-the-blanks"
  title="FillInTheBlanks component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/fill-in-the-blanks" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-fill-in-the-blanks

```tsx
<FillInTheBlanks
  checkId="report-fib"
  template="Report suspicious messages to the *security* team within *one hour* using the *Report phishing* button."
/>
```
:::

:::{tab-item} AI prompt
:sync: component-fill-in-the-blanks

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a FillInTheBlanks block (H5P-style: Fill in the Blanks) like this example inside the active <Lesson>:

<FillInTheBlanks
  checkId="report-fib"
  template="Report suspicious messages to the *security* team within *one hour* using the *Report phishing* button."
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "report-fib",
  "kind": "fillInBlanks",
  "question": "Report suspicious messages to the security team within one hour.",
  "template": "Report suspicious messages to the *security* team within *one hour*.",
  "blanks": [
    { "id": "blank-0", "answer": "security" },
    { "id": "blank-1", "answer": "one hour" }
  ]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-fill-in-the-blanks

Use `template` with `*` blanks in React; manifest can list explicit `blanks` for packaging.

```json
{
  "checkId": "report-fib",
  "kind": "fillInBlanks",
  "question": "Report suspicious messages to the security team within one hour.",
  "template": "Report suspicious messages to the *security* team within *one hour*.",
  "blanks": [
    { "id": "blank-0", "answer": "security" },
    { "id": "blank-1", "answer": "one hour" }
  ]
}
```
:::

::::
<!-- try-it:end -->




















## See also

- [Block catalog](../block-catalog.md)
- [Block cookbook — FillInTheBlanks](../../guides/react-developers/block-cookbook.md#fillintheblanks)
