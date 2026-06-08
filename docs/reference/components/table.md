# Table

:::{admonition} H5P equivalent
:class: tip

**H5P Table**
:::

## When to use

Use `Table` for **structured reference data** — rosters, comparison matrices, or lookup tables. Renders a semantic HTML table with optional `caption`.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-table

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/table"
  title="Table component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/table" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-table

```tsx
<Table
  blockId="escalation-table"
  caption="Security escalation contacts"
  headers={["Role", "Contact", "When to use"]}
  rows={[
    ["SOC analyst", "soc@company.example", "Active phishing or malware"],
    ["Privacy office", "privacy@company.example", "Data exposure suspected"],
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-table

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Table block (H5P-style: Table) like this example inside the active <Lesson>:

<Table
  blockId="escalation-table"
  caption="Security escalation contacts"
  headers={["Role", "Contact", "When to use"]}
  rows={[
    ["SOC analyst", "soc@company.example", "Active phishing or malware"],
    ["Privacy office", "privacy@company.example", "Data exposure suspected"],
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

- [Block catalog — Table](../block-catalog.md)
