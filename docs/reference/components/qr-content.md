# QrContent

:::{admonition} H5P equivalent
:class: tip

**H5P KewAr Code**
:::

## When to use

Use `QrContent` for **scan-to-reveal** bonus material — optional modules, job aids, or Easter-egg content unlocked after displaying a QR code.

## Requirements

- `payload` becomes the encoded QR target (URL or text).
- Hidden content appears after the learner activates reveal.
- The live demo encodes the published [security policy](../../project/security.md) on Read the Docs so scanning opens a reachable page.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-qr-content

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/qr-content"
  title="QrContent component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/qr-content" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-qr-content

```tsx
<QrContent
  blockId="bonus-qr"
  title="Scan for security checklist"
  payload="https://lessonkit.readthedocs.io/en/latest/project/security.html"
  hiddenTitle="Checklist unlocked"
  hiddenBody="Optional deep dive: password managers and travel VPN."
/>
```
:::

:::{tab-item} AI prompt
:sync: component-qr-content

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a QrContent block (H5P-style: KewAr Code) like this example inside the active <Lesson>:

<QrContent
  blockId="bonus-qr"
  title="Scan for security checklist"
  payload="https://lessonkit.readthedocs.io/en/latest/project/security.html"
  hiddenTitle="Checklist unlocked"
  hiddenBody="Optional deep dive: password managers and travel VPN."
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
