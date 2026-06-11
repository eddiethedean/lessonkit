# SingleChoiceSet

:::{admonition} H5P equivalent
:class: tip

**H5P Single Choice Set**
:::

## When to use

Use `SingleChoiceSet` for **sequential multiple-choice slides** with aggregated scoring — each step is a child `Quiz` or `KnowledgeCheck`.

## Requirements

- Child assessments need stable `checkId` values listed in `lessonkit.json`.
- Enable `showSetScore` for aggregate feedback across steps.
- Props and nesting: [block catalog — SingleChoiceSet](../block-catalog.md).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-single-choice-set

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/single-choice-set"
  title="SingleChoiceSet component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/single-choice-set" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-single-choice-set

```tsx
<SingleChoiceSet blockId="scs-demo" title="Security basics" showSetScore>
  <Quiz checkId="scs-q1" question="Report phishing to security?" choices={["Yes", "No"]} answer="Yes" />
  <Quiz
    checkId="scs-q2"
    question="Share passwords with colleagues?"
    choices={["Yes", "No"]}
    answer="No"
  />
</SingleChoiceSet>
```
:::

:::{tab-item} AI prompt
:sync: component-single-choice-set

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a SingleChoiceSet block (H5P-style: Single Choice Set) like this example inside the active <Lesson>:

<SingleChoiceSet blockId="scs-demo" title="Security basics" showSetScore>
  <Quiz checkId="scs-q1" question="Report phishing to security?" choices={["Yes", "No"]} answer="Yes" />
  <Quiz
    checkId="scs-q2"
    question="Share passwords with colleagues?"
    choices={["Yes", "No"]}
    answer="No"
  />
</SingleChoiceSet>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

[
  {
    "checkId": "scs-q1",
    "kind": "mcq",
    "question": "Report phishing to security?",
    "choices": ["Yes", "No"],
    "answer": "Yes"
  },
  {
    "checkId": "scs-q2",
    "kind": "mcq",
    "question": "Share passwords with colleagues?",
    "choices": ["Yes", "No"],
    "answer": "No"
  }
]

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-single-choice-set

No separate descriptor kind — declare each child `Quiz` in `course.assessments[]` with its own `checkId`.

```json
[
  {
    "checkId": "scs-q1",
    "kind": "mcq",
    "question": "Report phishing to security?",
    "choices": ["Yes", "No"],
    "answer": "Yes"
  },
  {
    "checkId": "scs-q2",
    "kind": "mcq",
    "question": "Share passwords with colleagues?",
    "choices": ["Yes", "No"],
    "answer": "No"
  }
]
```
:::

::::
<!-- try-it:end -->



## Manifest for child quizzes

`SingleChoiceSet` has no separate descriptor `kind`. List **each nested** `checkId` under `course.assessments[]`:

```json
[
  {
    "checkId": "scs-q1",
    "kind": "mcq",
    "question": "Report phishing to security?",
    "choices": ["Yes", "No"],
    "answer": "Yes"
  },
  {
    "checkId": "scs-q2",
    "kind": "mcq",
    "question": "Share passwords with colleagues?",
    "choices": ["Yes", "No"],
    "answer": "No"
  }
]
```

## Touch behavior

**Previous** / **Next** footer controls use `lk-button` minimum height. Each step delegates to child `Quiz` touch rows.

## Navigation and scoring

- Set `showSetScore` to display aggregate results after the final step.
- **Previous** / **Next** move between child `Quiz` blocks; **Next** stays disabled until the current step is completed.
- For multi-select child quizzes, learners must click **Check** before **Next** unlocks (same rule as [`Quiz`](quiz.md#multi-select-170)).

## See also

- [Quiz](quiz.md)
- [AssessmentSequence](assessment-sequence.md)
- [Block catalog — SingleChoiceSet](../block-catalog.md)
- [Block cookbook — SingleChoiceSet](../../guides/react-developers/block-cookbook.md#singlechoiceset)
- [Assessment showcase](../../examples/index.md#assessment-showcase-examplesassessments-p0)

