# Essay

:::{admonition} H5P equivalent
:class: tip

**H5P Essay**
:::

## When to use

Use `Essay` for **long-form written responses** that you score manually or treat as completion-only. Set `minLength` to require a minimum answer size before submit.

## Requirements

- Requires `checkId` inside `Lesson`.
- Typically completion-scored unless you integrate custom review workflows.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-essay

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/essay"
  title="Essay component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/essay" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-essay

```tsx
<Essay
  checkId="policy-essay"
  question="A vendor emails an urgent bank-detail change. Describe your verification steps before approving."
  minLength={40}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-essay

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Essay block (H5P-style: Essay) like this example inside the active <Lesson>:

<Essay
  checkId="policy-essay"
  question="A vendor emails an urgent bank-detail change. Describe your verification steps before approving."
  minLength={40}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "policy-essay",
  "kind": "essay",
  "question": "Describe how you would handle a suspicious invoice request."
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-essay

Essay blocks are typically completion-scored; include `checkId` for telemetry and export parity.

```json
{
  "checkId": "policy-essay",
  "kind": "essay",
  "question": "Describe how you would handle a suspicious invoice request."
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [Block catalog — Essay](../block-catalog.md)
