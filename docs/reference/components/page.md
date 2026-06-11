# Page

:::{admonition} H5P equivalent
:class: tip

**H5P Interactive Book (page)**
:::

## When to use

Use `Page` as a **child of `InteractiveBook`** — one chapter or section in a paginated handbook. Pages can contain any allowed content blocks and assessments.

Do not mount `Page` directly under `Lesson`; always wrap with [`InteractiveBook`](interactive-book.md).

## Requirements

- Each `Page` needs `blockId` and `title`.
- Book navigation and resume state are handled by the parent compound.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-page

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/page"
  title="Page component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/page" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-page

```tsx
<InteractiveBook blockId="policy-digest" title="Policy digest">
  <Page blockId="reporting" title="Reporting">
    <Text>Report incidents within one hour.</Text>
    <TrueFalse checkId="page-tf" question="Forwarding suspicious mail counts as reporting." answer={false} />
  </Page>
</InteractiveBook>
```
:::

:::{tab-item} AI prompt
:sync: component-page

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Page block (H5P-style: Interactive Book (page)) like this example inside the active <Lesson>:

<InteractiveBook blockId="policy-digest" title="Policy digest">
  <Page blockId="reporting" title="Reporting">
    <Text>Report incidents within one hour.</Text>
    <TrueFalse checkId="page-tf" question="Forwarding suspicious mail counts as reporting." answer={false} />
  </Page>
</InteractiveBook>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- Mount only inside the documented parent compound (see component page When to use).
Packaging notes:
`Page` has no manifest entry — it is a child of [`InteractiveBook`](interactive-book.md).
- Each `Page` needs a stable **`blockId`** for compound resume when persistence is enabled.
- The parent book owns navigation and stored state.
- Mirror any nested **`checkId`** values in `course.assessments[]` like standalone assessments.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync: component-page

`Page` has no manifest entry — it is a child of [`InteractiveBook`](interactive-book.md).

- Each `Page` needs a stable **`blockId`** for compound resume when persistence is enabled.
- The parent book owns navigation and stored state.
- Mirror any nested **`checkId`** values in `course.assessments[]` like standalone assessments.
:::

::::
<!-- try-it:end -->




















## See also

- [InteractiveBook](interactive-book.md)
