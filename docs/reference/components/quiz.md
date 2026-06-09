# Quiz

:::{admonition} H5P equivalent
:class: tip

**H5P Multiple Choice** — one question with several options and a single correct answer.

`KnowledgeCheck` is a **deprecated alias** of `Quiz` — import `Quiz` in new code. See the [KnowledgeCheck](knowledge-check.md) page if you maintain legacy imports.
:::

## When to use

Use `Quiz` when learners must **pick one correct option** from a short list. Ideal for procedure checks, tool selection, and “best first step” scenarios.

**Prefer something else when:**

- The answer is only true or false — use [`TrueFalse`](true-false.md).
- Learners construct an answer from blanks or draggable words — use fill-in or drag blocks.

## Requirements

- Must be inside an active `Lesson` for quiz telemetry (`lessonId` on events).
- `choices` and `answer` must match exactly (string equality).
- Optional `passingScore` for packaging (defaults apply per manifest).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-quiz

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/quiz"
  title="Quiz component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/quiz" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-quiz

```tsx
<Quiz
  checkId="verify-quiz"
  question="What should you verify before clicking a password-reset link?"
  choices={[
    "The sender domain and link destination",
    "The email font and signature image",
    "How urgent the subject line sounds",
  ]}
  answer="The sender domain and link destination"
/>
```
:::

:::{tab-item} AI prompt
:sync: component-quiz

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Quiz block (H5P-style: Multiple Choice) like this example inside the active <Lesson>:

<Quiz
  checkId="verify-quiz"
  question="What should you verify before clicking a password-reset link?"
  choices={[
    "The sender domain and link destination",
    "The email font and signature image",
    "How urgent the subject line sounds",
  ]}
  answer="The sender domain and link destination"
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "verify-quiz",
  "kind": "mcq",
  "question": "What should you verify before clicking a password-reset link?",
  "choices": ["The sender domain", "The email font", "How urgent it sounds"],
  "answer": "The sender domain"
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-quiz

Omit `kind` or set `"kind": "mcq"`. Choices and answer must match React props exactly.

```json
{
  "checkId": "verify-quiz",
  "kind": "mcq",
  "question": "What should you verify before clicking a password-reset link?",
  "choices": ["The sender domain", "The email font", "How urgent it sounds"],
  "answer": "The sender domain"
}
```
:::

::::
<!-- try-it:end -->
















## Multi-select (1.7.0)

When `answers` contains **more than one** correct label, `Quiz` switches to checkbox mode. Learners must click **Check** before the answer is scored. `maxScore` equals `answers.length`; partial credit counts correct selections, but any wrong choice fails the attempt.

```tsx
<Quiz
  checkId="hazards-multi"
  question="Select all workplace hazards"
  choices={["Phishing email", "Service portal", "Tailgating"]}
  answer="Phishing email"
  answers={["Phishing email", "Tailgating"]}
/>
```

In `lessonkit.json`, add `answers` alongside `answer` (required for backward compatibility):

```json
{
  "checkId": "hazards-multi",
  "kind": "mcq",
  "question": "Select all workplace hazards",
  "choices": ["Phishing email", "Service portal", "Tailgating"],
  "answer": "Phishing email",
  "answers": ["Phishing email", "Tailgating"]
}
```

Inside compounds (`AssessmentSequence`, `SingleChoiceSet`), **Next** stays disabled until **Check** is pressed in multi-select mode.

For **SCORM / LMS shell packaging**, omit multi-select quizzes from `lessonkit.json` `assessments[]` (SPA scores them in React). Single-select MCQ descriptors are unchanged.

## Choice shuffle and feedback (1.7.0)

| Prop | Behavior | Packaging |
| --- | --- | --- |
| `shuffleChoices` | Randomize option order in SPA | SPA-only |
| `shuffleSeed` | Stable order across resume (defaults to `checkId`) | SPA-only |
| `choiceFeedback` | Map of choice label → feedback string; announced via `aria-live` | SPA-only |

Omit these props for identical behavior to 1.6.x single-select quizzes.

## See also

- [Block catalog — Quiz](../block-catalog.md)
- [Block cookbook — Quiz](../../guides/react-developers/block-cookbook.md#quiz)
