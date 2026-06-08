# Chart

:::{admonition} H5P equivalent
:class: tip

**H5P Chart**
:::

## When to use

Use `Chart` to visualize **simple metrics** — incident counts, survey breakdowns, or category comparisons. Supports `bar` and `pie`; empty data falls back gracefully.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-chart

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/chart"
  title="Chart component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/chart" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-chart

```tsx
<Chart
  blockId="incidents-chart"
  type="bar"
  title="Reported incidents — Q1"
  data={[
    { label: "Phishing", value: 42 },
    { label: "Malware", value: 11 },
    { label: "Lost device", value: 4 },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-chart

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Chart block (H5P-style: Chart) like this example inside the active <Lesson>:

<Chart
  blockId="incidents-chart"
  type="bar"
  title="Reported incidents — Q1"
  data={[
    { label: "Phishing", value: 42 },
    { label: "Malware", value: 11 },
    { label: "Lost device", value: 4 },
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

- [Block catalog — Chart](../block-catalog.md)
