# Questionnaire

:::{admonition} H5P equivalent
:class: tip

**H5P Questionnaire**
:::

## When to use

Use `Questionnaire` for **multi-field surveys** — exit tickets, needs analysis, or qualitative feedback with several text/textarea fields.

Emits `questionnaire_submitted` when tracking is enabled; not auto-scored.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-questionnaire

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/questionnaire"
  title="Questionnaire component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/questionnaire" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-questionnaire

```tsx
<Questionnaire
  blockId="exit-survey"
  fields={[
    { id: "role", label: "Your role", type: "text" },
    { id: "confidence", label: "Confidence spotting phishing (1–5)", type: "text" },
    { id: "feedback", label: "What was most useful?", type: "textarea" },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-questionnaire

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Questionnaire block (H5P-style: Questionnaire) like this example inside the active <Lesson>:

<Questionnaire
  blockId="exit-survey"
  fields={[
    { id: "role", label: "Your role", type: "text" },
    { id: "confidence", label: "Confidence spotting phishing (1–5)", type: "text" },
    { id: "feedback", label: "What was most useful?", type: "textarea" },
  ]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

::::
<!-- try-it:end -->
















## See also

- [Reflection](reflection.md) — single open prompt
