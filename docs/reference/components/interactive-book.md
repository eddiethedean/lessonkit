# InteractiveBook

:::{admonition} H5P equivalent
:class: tip

**H5P Interactive Book** — paginated content with optional checks per page and resume state.
:::

## When to use

Use `InteractiveBook` for **multi-page reading** inside one lesson — handbooks, policy digests, or guided walkthroughs where learners move page-by-page.

Children must be [`Page`](../block-catalog.md) blocks. Each page can contain content blocks and assessments (the demo ends with a `TrueFalse` on the last page).

Supports compound resume state so learners can continue where they left off.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-interactive-book

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/interactive-book"
  title="InteractiveBook component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/interactive-book" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-interactive-book

```tsx
<InteractiveBook blockId="safety-book" title="Security handbook">
  <Page blockId="book-intro" title="Reporting">
    <Text>Use the Report phishing action - do not forward suspicious messages.</Text>
  </Page>
  <Page blockId="book-devices" title="Devices">
    <Text>Lock your screen when leaving your desk.</Text>
  </Page>
  <Page blockId="book-check" title="Knowledge check">
    <TrueFalse checkId="book-tf" question="Forwarding suspicious mail is better than Report phishing." answer={false} />
  </Page>
</InteractiveBook>
```
:::

:::{tab-item} AI prompt
:sync: component-interactive-book

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a InteractiveBook block (H5P-style: Interactive Book) like this example inside the active <Lesson>:

<InteractiveBook blockId="safety-book" title="Security handbook">
  <Page blockId="book-intro" title="Reporting">
    <Text>Use the Report phishing action - do not forward suspicious messages.</Text>
  </Page>
  <Page blockId="book-devices" title="Devices">
    <Text>Lock your screen when leaving your desk.</Text>
  </Page>
  <Page blockId="book-check" title="Knowledge check">
    <TrueFalse checkId="book-tf" question="Forwarding suspicious mail is better than Report phishing." answer={false} />
  </Page>
</InteractiveBook>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Packaging notes:
Compound blocks are authored in React — there is no `lessonkit.json` row for `InteractiveBook` itself.
- Set stable **`blockId`** on `InteractiveBook` and each child **`Page`** when `config.session.persistCompoundState` is true (default).
- Add nested assessment **`checkId`** values under `course.assessments[]` (for example `book-tf` on a page).
- Session resume stores page index and child assessment state. See [Core — compound state](../core.md#compound-state-and-resume).

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync: component-interactive-book

Compound blocks are authored in React — there is no `lessonkit.json` row for `InteractiveBook` itself.

- Set stable **`blockId`** on `InteractiveBook` and each child **`Page`** when `config.session.persistCompoundState` is true (default).
- Add nested assessment **`checkId`** values under `course.assessments[]` (for example `book-tf` on a page).
- Session resume stores page index and child assessment state. See [Core — compound state](../core.md#compound-state-and-resume).
:::

::::
<!-- try-it:end -->




















## See also

- [interactive-book example](../../examples/index.md#interactive-book-examplesinteractive-book)
- [Block catalog — InteractiveBook](../block-catalog.md)
