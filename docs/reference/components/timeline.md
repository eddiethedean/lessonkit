# Timeline

:::{admonition} H5P equivalent
:class: tip

**H5P Timeline**
:::

## When to use

Use `Timeline` for **chronological narratives** — product history, policy evolution, or incident timelines. Each event has `date`, `title`, and `body`; optional media per event.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-timeline

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/timeline"
  title="Timeline component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/timeline" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-timeline

```tsx
<Timeline
  blockId="playbook-timeline"
  events={[
    { id: "t1", date: "2024-03-15", title: "Tabletop exercise", body: "Gaps in invoice-fraud verification." },
    { id: "t2", date: "2024-06-01", title: "Report phishing rollout", body: "One-click reporting in mail clients." },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-timeline

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Timeline block (H5P-style: Timeline) like this example inside the active <Lesson>:

<Timeline
  blockId="playbook-timeline"
  events={[
    { id: "t1", date: "2024-03-15", title: "Tabletop exercise", body: "Gaps in invoice-fraud verification." },
    { id: "t2", date: "2024-06-01", title: "Report phishing rollout", body: "One-click reporting in mail clients." },
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

- [Block catalog — Timeline](../block-catalog.md)
