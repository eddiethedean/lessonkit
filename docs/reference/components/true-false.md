# TrueFalse

:::{admonition} H5P equivalent
:class: tip

**H5P True/False** — single-statement agree/disagree with optional retry and scoring.
:::

## When to use

Use `TrueFalse` for a **single binary claim** where learners must decide if a statement is accurate. It works well for policy attestation, myth-busting, and quick checks after a short reading.

**Prefer something else when:**

- Learners need more than two outcomes — use [`Quiz`](quiz.md) (multiple choice).
- The task is selecting words or dragging items — use [`MarkTheWords`](mark-the-words.md) or [`DragTheWords`](drag-the-words.md).

## Requirements

- Wrap in [`Course`](../block-catalog.md) → [`Lesson`](../block-catalog.md).
- Provide a stable `checkId` (matches `lessonkit.json` when packaging).
- Emits `assessment_answered` and `assessment_completed` telemetry when tracking is enabled.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-true-false

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/true-false"
  title="TrueFalse component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/true-false" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-true-false

```tsx
<TrueFalse
  checkId="phishing-tf"
  question="Phishing emails always use your real name in the greeting."
  answer={false}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-true-false

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a TrueFalse block (H5P-style: True/False) like this example inside the active <Lesson>:

<TrueFalse
  checkId="phishing-tf"
  question="Phishing emails always use your real name in the greeting."
  answer={false}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "phishing-tf",
  "kind": "trueFalse",
  "question": "Phishing emails always use your real name in the greeting.",
  "answer": false
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-true-false

Add under `course.assessments[]`. `checkId` must match the React prop.

```json
{
  "checkId": "phishing-tf",
  "kind": "trueFalse",
  "question": "Phishing emails always use your real name in the greeting.",
  "answer": false
}
```
:::

::::
<!-- try-it:end -->




















## Touch behavior

True and False options use `lk-quiz-choice` for 44px minimum row height when `@lessonkit/themes/base.css` is imported. Tap either radio label on phones and tablets without relying on hover styles.

## See also

- [Block catalog — TrueFalse](../block-catalog.md)
- [Block cookbook — TrueFalse](../../guides/react-developers/block-cookbook.md#truefalse)
- [AssessmentSequence](assessment-sequence.md) — chain multiple checks in one flow
