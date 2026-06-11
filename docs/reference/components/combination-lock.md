# CombinationLock

:::{admonition} H5P equivalent
:class: tip

**H5P Combination Lock**
:::

## When to use

Use `CombinationLock` for **numeric code entry** puzzles — vault codes, PIN verification drills, or gamified access challenges. Each digit field starts empty with a visible placeholder; typing replaces the active cell and advances focus.

## Requirements

- `combination` is a string of digits; UI renders one wheel per digit.
- Requires `checkId` for assessment telemetry and packaging.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-combination-lock

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/combination-lock"
  title="CombinationLock component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/combination-lock" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-combination-lock

```tsx
<CombinationLock checkId="vault-lock" combination="1234" label="Enter demo vault code (training only)" />
```
:::

:::{tab-item} AI prompt
:sync: component-combination-lock

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a CombinationLock block (H5P-style: Combination Lock) like this example inside the active <Lesson>:

<CombinationLock checkId="vault-lock" combination="1234" label="Enter demo vault code (training only)" />

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "vault-lock",
  "kind": "combinationLock",
  "question": "Enter the vault code.",
  "combination": "1234"
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-combination-lock

Add under `course.assessments[]`:

```json
{
  "checkId": "vault-lock",
  "kind": "combinationLock",
  "question": "Enter the vault code.",
  "combination": "1234"
}
```
:::

::::
<!-- try-it:end -->




















## See also

- [Block catalog](../block-catalog.md)
