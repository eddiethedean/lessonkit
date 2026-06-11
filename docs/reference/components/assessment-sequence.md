# AssessmentSequence

:::{admonition} H5P equivalent
:class: tip

**H5P Question Set** — present multiple question types in one scored flow with shared progress.
:::

## When to use

Use `AssessmentSequence` to **chain assessments** in a fixed order — module quizzes, attestation flows, or a single “checkpoint” lesson that mixes `TrueFalse`, `Quiz`, and drag-style blocks.

Child blocks keep their own `checkId`. The sequence provides navigation, aggregate scoring UI, and compound telemetry (`blockId` on the parent).

The demo combines `TrueFalse` and `Quiz` to show how mixed types work in one flow.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-assessment-sequence

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/assessment-sequence"
  title="AssessmentSequence component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/assessment-sequence" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-assessment-sequence

```tsx
<AssessmentSequence blockId="module-sequence">
  <TrueFalse
    checkId="seq-tf"
    question="Public Wi‑Fi is safe for payroll access without a VPN."
    answer={false}
  />
  <Quiz
    checkId="seq-quiz"
    question="Best first step for a suspicious invoice?"
    choices={[
      "Pay immediately to avoid late fees",
      "Verify through procurement or a known contact",
      "Forward the PDF to your team chat",
    ]}
    answer="Verify through procurement or a known contact"
  />
</AssessmentSequence>
```
:::

:::{tab-item} AI prompt
:sync: component-assessment-sequence

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a AssessmentSequence block (H5P-style: Question Set) like this example inside the active <Lesson>:

<AssessmentSequence blockId="module-sequence">
  <TrueFalse
    checkId="seq-tf"
    question="Public Wi‑Fi is safe for payroll access without a VPN."
    answer={false}
  />
  <Quiz
    checkId="seq-quiz"
    question="Best first step for a suspicious invoice?"
    choices={[
      "Pay immediately to avoid late fees",
      "Verify through procurement or a known contact",
      "Forward the PDF to your team chat",
    ]}
    answer="Verify through procurement or a known contact"
  />
</AssessmentSequence>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

[
  {
    "checkId": "seq-tf",
    "kind": "trueFalse",
    "question": "Public Wi‑Fi is safe for payroll access.",
    "answer": false
  },
  {
    "checkId": "seq-quiz",
    "kind": "mcq",
    "question": "Best first step for a suspicious invoice?",
    "choices": ["Pay immediately", "Verify through procurement"],
    "answer": "Verify through procurement"
  }
]

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-assessment-sequence

The sequence container uses **`blockId`**, not `checkId`. Set a stable `blockId` when `config.session.persistCompoundState` is true so learners resume the active step.

List **each child** `checkId` under `course.assessments[]`:

```json
[
  {
    "checkId": "seq-tf",
    "kind": "trueFalse",
    "question": "Public Wi‑Fi is safe for payroll access.",
    "answer": false
  },
  {
    "checkId": "seq-quiz",
    "kind": "mcq",
    "question": "Best first step for a suspicious invoice?",
    "choices": ["Pay immediately", "Verify through procurement"],
    "answer": "Verify through procurement"
  }
]
```
:::

::::
<!-- try-it:end -->




















## See also

- [Block catalog](../block-catalog.md)
- [assessments-p0 example](../../examples/index.md#assessment-showcase-examplesassessments-p0)
