# GuessTheAnswer

:::{admonition} H5P equivalent
:class: tip

**H5P Guess the Answer**
:::

## When to use

Use `GuessTheAnswer` for **hidden-answer discovery** — learners reveal or type a short answer after a prompt. Set `scored={false}` for reveal-only interactions without LMS scoring.

Set `kind: "guessTheAnswer"` in `lessonkit.json` when packaging scored variants.

## Requirements

- `checkId` is required when `scored` is true (default).
- Props and telemetry: [block catalog — GuessTheAnswer](../block-catalog.md).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-guess-the-answer

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/guess-the-answer"
  title="GuessTheAnswer component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/guess-the-answer" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-guess-the-answer

```tsx
<GuessTheAnswer
  checkId="policy-guess"
  prompt="What is the EU privacy regulation acronym?"
  answer="GDPR"
/>
```
:::

:::{tab-item} AI prompt
:sync: component-guess-the-answer

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a GuessTheAnswer block (H5P-style: Guess the Answer) like this example inside the active <Lesson>:

<GuessTheAnswer
  checkId="policy-guess"
  prompt="What is the EU privacy regulation acronym?"
  answer="GDPR"
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "policy-guess",
  "kind": "guessTheAnswer",
  "question": "What is the EU privacy regulation acronym?",
  "answer": "GDPR"
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-guess-the-answer

Scored variants use `kind: "guessTheAnswer"` and are SPA-only in the LMS shell. Set `scored={false}` in React for reveal-only mode (no descriptor required).

```json
{
  "checkId": "policy-guess",
  "kind": "guessTheAnswer",
  "question": "What is the EU privacy regulation acronym?",
  "answer": "GDPR"
}
```
:::

::::
<!-- try-it:end -->



## Reveal-only mode

Set `scored={false}` for glossary-style reveals — no `checkId`, no `lessonkit.json` descriptor, and no scoring telemetry:

```tsx
<GuessTheAnswer
  scored={false}
  prompt="What does MFA stand for?"
  answer="Multi-factor authentication"
/>
```

## Touch behavior

Text inputs use 16px+ font size to avoid iOS zoom. **Check** and reveal buttons use `lk-button` touch targets when base theme CSS is imported.

## Scored mode and matching

When `scored` is true (default), learners type an answer and click **Check**. Matching is **case-insensitive** after trim and collapsed whitespace. Add `kind: "guessTheAnswer"` under `course.assessments[]` for SPA parity. Omit from `assessments[]` when packaging SCORM/xAPI/cmi5 if you rely on shell scoring only — same rule as [`FillInTheBlanks`](fill-in-the-blanks.md).

## See also

- [TrueFalse](true-false.md)
- [Block catalog — GuessTheAnswer](../block-catalog.md)
- [Block cookbook — GuessTheAnswer](../../guides/react-developers/block-cookbook.md#guesstheanswer)
- [Assessment showcase](../../examples/index.md#assessment-showcase-examplesassessments-p0) — scored `GuessTheAnswer` in a sequence

