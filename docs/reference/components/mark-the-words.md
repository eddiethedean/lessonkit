# MarkTheWords

:::{admonition} H5P equivalent
:class: tip

**H5P Mark the Words** — learners click words or phrases in a sentence that match a target set.
:::

## When to use

Use `MarkTheWords` when learners must **identify specific terms** in running text — spotting risky language in email copy, policy violations, or keywords in a procedure.

Provide `correctWords` as an array of strings that must be selected. The demo uses a single sentence; longer passages work the same way.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-mark-the-words

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/mark-the-words"
  title="MarkTheWords component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/mark-the-words" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-mark-the-words

```tsx
<MarkTheWords
  checkId="policy-mtw"
  text="Never share your password, MFA codes, or one-time recovery links with colleagues or vendors."
  correctWords={["password", "MFA", "recovery"]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-mark-the-words

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a MarkTheWords block (H5P-style: Mark the Words) like this example inside the active <Lesson>:

<MarkTheWords
  checkId="policy-mtw"
  text="Never share your password, MFA codes, or one-time recovery links with colleagues or vendors."
  correctWords={["password", "MFA", "recovery"]}
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "policy-mtw",
  "kind": "markTheWords",
  "question": "Never share your password or MFA codes with colleagues.",
  "correctWords": ["password", "MFA"]
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync-group: component-mark-the-words

Add under `course.assessments[]`:

```json
{
  "checkId": "policy-mtw",
  "kind": "markTheWords",
  "question": "Never share your password or MFA codes with colleagues.",
  "correctWords": ["password", "MFA"]
}
```
:::

::::
<!-- try-it:end -->
















## See also

- [Block catalog](../block-catalog.md)
- [Block cookbook — MarkTheWords](../../guides/react-developers/block-cookbook.md#markthewords)
