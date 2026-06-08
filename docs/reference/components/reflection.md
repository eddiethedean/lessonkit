# Reflection

## When to use

Use `Reflection` for **open-ended learner input** — commitments, journaling, or qualitative feedback at the end of a lesson.

Reflections are not auto-scored. Use `useTracking().interaction()` or custom LMS hooks if you need to capture responses server-side.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-reflection

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/reflection"
  title="Reflection component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/reflection" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-reflection

```tsx
<Reflection
  blockId="lesson-reflection"
  prompt="Describe one habit you will change after this module and how you will remind yourself."
  hint="Example: I will hover links and verify sender domains before clicking."
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-reflection

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Reflection block like this example inside the active <Lesson>:

<Reflection
  blockId="lesson-reflection"
  prompt="Describe one habit you will change after this module and how you will remind yourself."
  hint="Example: I will hover links and verify sender domains before clicking."
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

- [Block catalog — Reflection](../block-catalog.md)
