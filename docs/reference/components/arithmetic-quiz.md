# ArithmeticQuiz

:::{admonition} H5P equivalent
:class: tip

**H5P Arithmetic Quiz**
:::

## When to use

Use `ArithmeticQuiz` for **numeric drill** — quick mental math checks with optional `timeLimitSeconds`.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-arithmetic-quiz

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/arithmetic-quiz"
  title="ArithmeticQuiz component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/arithmetic-quiz" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-arithmetic-quiz

```tsx
<ArithmeticQuiz
  checkId="shift-handoff"
  problems={[
    { question: "Phishing reports: 3 new + 2 escalated = ?", answer: "5" },
    { question: "Open tickets after closing 4 of 9 = ?", answer: "5" },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-arithmetic-quiz

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a ArithmeticQuiz block (H5P-style: Arithmetic Quiz) like this example inside the active <Lesson>:

<ArithmeticQuiz
  checkId="shift-handoff"
  problems={[
    { question: "Phishing reports: 3 new + 2 escalated = ?", answer: "5" },
    { question: "Open tickets after closing 4 of 9 = ?", answer: "5" },
  ]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "arith-quiz",
  "kind": "arithmeticQuiz",
  "question": "Quick math check",
  "problems": [
    { "question": "3 + 4", "answer": "7" }
  ]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync-group: component-arithmetic-quiz

Add under `course.assessments[]`:

```json
{
  "checkId": "arith-quiz",
  "kind": "arithmeticQuiz",
  "question": "Quick math check",
  "problems": [
    { "question": "3 + 4", "answer": "7" }
  ]
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [Quiz](quiz.md) — non-numeric multiple choice
