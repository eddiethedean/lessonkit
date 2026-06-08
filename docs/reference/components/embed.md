# Embed

:::{admonition} H5P equivalent
:class: tip

**H5P Iframe Embedder**
:::

## When to use

Use `Embed` for **sandboxed third-party content** — external tools, legacy pages, or partner widgets that must stay in an iframe.

Configure `config.embed.allowedHosts` in production so only approved origins load.

## Requirements

- Always set a descriptive `title` for screen readers.
- Optional `allow` sandbox tokens and `aspectRatio` for layout.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-embed

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/embed"
  title="Embed component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/embed" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-embed

```tsx
<Text>Allowlist embed hosts in production course config.</Text>
<Embed blockId="policy-embed" src="https://approved.example.com/widget" title="Policy lookup" />
```
:::

:::{tab-item} AI prompt
:sync-group: component-embed

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Embed block (H5P-style: Iframe Embedder) like this example inside the active <Lesson>:

<Text>Allowlist embed hosts in production course config.</Text>
<Embed blockId="policy-embed" src="https://approved.example.com/widget" title="Policy lookup" />

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

- [Production checklist](../../guides/react-developers/production-checklist.md)
