# Summary

:::{admonition} H5P equivalent
:class: tip

**H5P Summary**
:::

## When to use

Use `Summary` when learners must **pick the correct statements** from a larger pool — recap exercises, “build the policy summary,” or filtering facts from distractors.

**Prefer [`Quiz`](quiz.md)** for a single best answer, or [`AssessmentSequence`](assessment-sequence.md) to chain multiple scored blocks.

## Requirements

- Requires `checkId` inside an active `Lesson`.
- `statements` is the full pool; `correct` lists the valid subset (order matters for scoring).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-summary

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/summary"
  title="Summary component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/summary" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-summary

```tsx
<Summary
  checkId="summary-1"
  statements={[
    "Isolate affected accounts",
    "Report to security within one hour",
    "Share passwords in chat for speed",
    "Preserve message headers for investigation",
  ]}
  correct={[
    "Isolate affected accounts",
    "Report to security within one hour",
    "Preserve message headers for investigation",
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-summary

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Summary block (H5P-style: Summary) like this example inside the active <Lesson>:

<Summary
  checkId="summary-1"
  statements={[
    "Isolate affected accounts",
    "Report to security within one hour",
    "Share passwords in chat for speed",
    "Preserve message headers for investigation",
  ]}
  correct={[
    "Isolate affected accounts",
    "Report to security within one hour",
    "Preserve message headers for investigation",
  ]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "summary-1",
  "kind": "summary",
  "question": "Select the correct policy statements.",
  "statements": ["Wear PPE", "Report hazards", "Ignore alarms"],
  "correct": ["Wear PPE", "Report hazards"]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync-group: component-summary

Add under `course.assessments[]`:

```json
{
  "checkId": "summary-1",
  "kind": "summary",
  "question": "Select the correct policy statements.",
  "statements": ["Wear PPE", "Report hazards", "Ignore alarms"],
  "correct": ["Wear PPE", "Report hazards"]
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [Block catalog](../block-catalog.md)
- [framework-12-showcase example](../../examples/index.md#framework-12-showcase-examplesframework-12-showcase)
