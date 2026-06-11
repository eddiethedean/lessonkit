# InformationWall

:::{admonition} H5P equivalent
:class: tip

**H5P Information Wall**
:::

## When to use

Use `InformationWall` for **searchable reference libraries** — policy indexes, FAQ walls, or knowledge bases with many short panels.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-information-wall

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/information-wall"
  title="InformationWall component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/information-wall" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-information-wall

```tsx
<InformationWall
  blockId="policy-wall"
  panels={[
    { id: "phish", title: "Phishing", body: "Report via Report message." },
    { id: "mfa", title: "MFA", body: "Approve only prompts you initiated." },
    { id: "travel", title: "Travel", body: "Use corporate VPN on hotel Wi‑Fi." },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-information-wall

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a InformationWall block (H5P-style: Information Wall) like this example inside the active <Lesson>:

<InformationWall
  blockId="policy-wall"
  panels={[
    { id: "phish", title: "Phishing", body: "Report via Report message." },
    { id: "mfa", title: "MFA", body: "Approve only prompts you initiated." },
    { id: "travel", title: "Travel", body: "Use corporate VPN on hotel Wi‑Fi." },
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

- [Accordion](accordion.md) — collapsible sections without search
