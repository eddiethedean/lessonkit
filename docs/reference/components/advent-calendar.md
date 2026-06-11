# AdventCalendar

:::{admonition} H5P equivalent
:class: tip

**H5P Advent Calendar**
:::

## When to use

Use `AdventCalendar` for **date-gated daily content** — December security tips, onboarding drips, or unlock-by-day campaigns.

Optional `unlockFrom` ISO date controls which doors open.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-advent-calendar

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/advent-calendar"
  title="AdventCalendar component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/advent-calendar" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-advent-calendar

```tsx
<AdventCalendar
  blockId="december-tips"
  doors={[
    { id: "d1", day: 1, label: "1", content: <Text>Verify sender domains.</Text> },
    { id: "d2", day: 2, label: "2", content: <Text>Lock your screen when away.</Text> },
    { id: "d3", day: 3, label: "3", content: <Text>Use MFA on every work account.</Text> },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-advent-calendar

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a AdventCalendar block (H5P-style: Advent Calendar) like this example inside the active <Lesson>:

<AdventCalendar
  blockId="december-tips"
  doors={[
    { id: "d1", day: 1, label: "1", content: <Text>Verify sender domains.</Text> },
    { id: "d2", day: 2, label: "2", content: <Text>Lock your screen when away.</Text> },
    { id: "d3", day: 3, label: "3", content: <Text>Use MFA on every work account.</Text> },
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

- [Block catalog](../block-catalog.md)
