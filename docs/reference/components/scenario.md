# Scenario

## When to use

Use `Scenario` for **narrative framing** — inbox simulations, dialogue setup, or situational context before a decision. It is a semantic content container, not a scored assessment.

Set `blockId` when you want stable block URNs on manual `interaction` events via `useTracking()`.

**Pair with** [`Quiz`](quiz.md), [`TrueFalse`](true-false.md), or custom buttons that call `useTracking().interaction()` when learners take an action.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-scenario

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/scenario"
  title="Scenario component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/scenario" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-scenario

```tsx
<Scenario blockId="inbox-scenario">
  <p>
    You receive an email from <strong>payroll-notify@hr-portal-support.net</strong> asking
    you to confirm direct deposit details before end of day.
  </p>
  <p>What is your first move?</p>
</Scenario>
```
:::

:::{tab-item} AI prompt
:sync: component-scenario

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Scenario block like this example inside the active <Lesson>:

<Scenario blockId="inbox-scenario">
  <p>
    You receive an email from <strong>payroll-notify@hr-portal-support.net</strong> asking
    you to confirm direct deposit details before end of day.
  </p>
  <p>What is your first move?</p>
</Scenario>

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

- [Block catalog — Scenario](../block-catalog.md)
- [react-vite example](../../examples/index.md#cybersecurity-awareness-examplesreact-vite) — scenarios in a full course
