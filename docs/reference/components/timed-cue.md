# TimedCue

:::{admonition} H5P equivalent
:class: tip

**H5P Interactive Video (cue)**
:::

:::{admonition} Parent compound
:class: important

`TimedCue` only works inside [`InteractiveVideo`](interactive-video.md). It is not a standalone video block — use [`Video`](video.md) for clips without timed overlays.
:::

## When to use

Use `TimedCue` as a **child of `InteractiveVideo`** to surface content or assessments at a timestamp. Set `mustComplete` on scored cues that should block video progress.

The demo shows a required `TrueFalse` at 3s and an informational `Text` cue at 8s.

## Requirements

- `atSeconds` is the trigger time.
- Cue children are usually assessments or short content blocks.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-timed-cue

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/timed-cue"
  title="TimedCue component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/timed-cue" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-timed-cue

```tsx
<InteractiveVideo blockId="access-briefing" title="Facility access" src="/media/sample-briefing.mp4">
  <TimedCue atSeconds={3} label="Tailgating" mustComplete>
    <TrueFalse checkId="cue-tf" question="Tailgating through secure doors is allowed." answer={false} />
  </TimedCue>
  <TimedCue atSeconds={8} label="Badges">
    <Text>Badges must be visible in secure areas.</Text>
  </TimedCue>
  <TimedCue atSeconds={9} label="Reporting" mustComplete>
    <TrueFalse checkId="cue-tf-2" question="Report lost badges to security the same day." answer={true} />
  </TimedCue>
</InteractiveVideo>
```
:::

:::{tab-item} AI prompt
:sync: component-timed-cue

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a TimedCue block (H5P-style: Interactive Video (cue)) like this example inside the active <Lesson>:

<InteractiveVideo blockId="access-briefing" title="Facility access" src="/media/sample-briefing.mp4">
  <TimedCue atSeconds={3} label="Tailgating" mustComplete>
    <TrueFalse checkId="cue-tf" question="Tailgating through secure doors is allowed." answer={false} />
  </TimedCue>
  <TimedCue atSeconds={8} label="Badges">
    <Text>Badges must be visible in secure areas.</Text>
  </TimedCue>
  <TimedCue atSeconds={9} label="Reporting" mustComplete>
    <TrueFalse checkId="cue-tf-2" question="Report lost badges to security the same day." answer={true} />
  </TimedCue>
</InteractiveVideo>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- Mount only inside the documented parent compound (see component page When to use).
Packaging notes:
`TimedCue` is a child of [`InteractiveVideo`](interactive-video.md) — no manifest row for the cue wrapper.
- Scored children inside a cue need **`checkId`** entries in `course.assessments[]`.
- Set **`mustComplete`** on cues that should block video progress.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync: component-timed-cue

`TimedCue` is a child of [`InteractiveVideo`](interactive-video.md) — no manifest row for the cue wrapper.

- Scored children inside a cue need **`checkId`** entries in `course.assessments[]`.
- Set **`mustComplete`** on cues that should block video progress.
:::

::::
<!-- try-it:end -->
















## See also

- [InteractiveVideo](interactive-video.md)
- [InteractiveVideo live demo](../../_static/component-demos/index.html#/interactive-video)
