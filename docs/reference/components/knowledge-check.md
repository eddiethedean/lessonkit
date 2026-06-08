# KnowledgeCheck

:::{admonition} H5P equivalent
:class: tip

**H5P Multiple Choice**
:::

## When to use

`KnowledgeCheck` is a **deprecated alias** of [`Quiz`](quiz.md) with identical behavior and telemetry. Use **`Quiz` in new code**; keep this name only when maintaining legacy courses or manifests that already import `KnowledgeCheck`.

## Requirements

Same as `Quiz`: requires `checkId`, `question`, `choices`, and `answer` inside an active `Lesson`.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-knowledge-check

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/knowledge-check"
  title="KnowledgeCheck component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/knowledge-check" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-knowledge-check

```tsx
// Prefer Quiz in new projects:
import { Quiz } from "@lessonkit/react";

// Legacy alias (still supported):
<KnowledgeCheck
  checkId="kc-demo"
  question="Which channel is approved for password resets?"
  choices={[
    "Self-service portal linked from the intranet",
    "Reply to the email that prompted the reset",
  ]}
  answer="Self-service portal linked from the intranet"
/>
```
:::

:::{tab-item} AI prompt
:sync: component-knowledge-check

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a KnowledgeCheck block (H5P-style: Multiple Choice) like this example inside the active <Lesson>:

// Prefer Quiz in new projects:
import { Quiz } from "@lessonkit/react";

// Legacy alias (still supported):
<KnowledgeCheck
  checkId="kc-demo"
  question="Which channel is approved for password resets?"
  choices={[
    "Self-service portal linked from the intranet",
    "Reply to the email that prompted the reset",
  ]}
  answer="Self-service portal linked from the intranet"
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- Prefer importing Quiz in new code; KnowledgeCheck is a deprecated alias with identical behavior.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "kc-demo",
  "kind": "mcq",
  "question": "Which channel is approved for password resets?",
  "choices": ["Self-service portal", "Reply to the email", "Text a colleague"],
  "answer": "Self-service portal"
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-knowledge-check

Same manifest shape as `Quiz`. Prefer importing `Quiz` in new React code.

```json
{
  "checkId": "kc-demo",
  "kind": "mcq",
  "question": "Which channel is approved for password resets?",
  "choices": ["Self-service portal", "Reply to the email", "Text a colleague"],
  "answer": "Self-service portal"
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [Quiz](quiz.md)
- [Block catalog](../block-catalog.md)
