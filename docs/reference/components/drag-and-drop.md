# DragAndDrop

:::{admonition} H5P equivalent
:class: tip

**H5P Drag and Drop** — sort or classify items into labeled drop targets.
:::

## When to use

Use `DragAndDrop` for **classification** — sorting risks vs safe actions, mapping tools to teams, or pairing concepts with categories.

Each `items` entry needs a unique `id`. Each `targets` entry lists which item `id` it accepts via `accepts`.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-drag-and-drop

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/drag-and-drop"
  title="DragAndDrop component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/drag-and-drop" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-drag-and-drop

```tsx
<DragAndDrop
  checkId="channel-dad"
  items={[
    { id: "email", label: "Unknown payment link in email" },
    { id: "portal", label: "IT self-service portal" },
    { id: "phone", label: "Unsolicited callback number" },
  ]}
  targets={[
    { id: "email-risk", label: "Verify before acting", accepts: "email" },
    { id: "phone-risk", label: "Call back via known number", accepts: "phone" },
    { id: "safe", label: "Approved channel", accepts: "portal" },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-drag-and-drop

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a DragAndDrop block (H5P-style: Drag and Drop) like this example inside the active <Lesson>:

<DragAndDrop
  checkId="channel-dad"
  items={[
    { id: "email", label: "Unknown payment link in email" },
    { id: "portal", label: "IT self-service portal" },
    { id: "phone", label: "Unsolicited callback number" },
  ]}
  targets={[
    { id: "email-risk", label: "Verify before acting", accepts: "email" },
    { id: "phone-risk", label: "Call back via known number", accepts: "phone" },
    { id: "safe", label: "Approved channel", accepts: "portal" },
  ]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "channel-dad",
  "kind": "dragAndDrop",
  "question": "Sort channels by risk",
  "items": ["email", "portal"],
  "targets": ["risk", "safe"]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-drag-and-drop

Add under `course.assessments[]`:

```json
{
  "checkId": "channel-dad",
  "kind": "dragAndDrop",
  "question": "Sort channels by risk",
  "items": ["email", "portal"],
  "targets": ["risk", "safe"]
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [Block catalog](../block-catalog.md)
- [Block cookbook — DragAndDrop](../../guides/react-developers/block-cookbook.md#draganddrop)
