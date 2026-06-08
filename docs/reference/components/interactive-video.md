# InteractiveVideo

:::{admonition} H5P equivalent
:class: tip

**H5P Interactive Video**
:::

## When to use

Use `InteractiveVideo` when **video playback and learner actions are synchronized** — pause for checks, surface reminders at timestamps, or gate progress until cues complete.

Children must be `TimedCue` blocks. The demo pairs a `TrueFalse` check with a `Text` reminder.

## Requirements

- Wrap scored cues with `mustComplete` when they should block progress.
- Enable `showVideoScore` for aggregate feedback across cue assessments.
- Supports compound resume (playback position + completed cues).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-interactive-video

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/interactive-video"
  title="InteractiveVideo component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/interactive-video" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-interactive-video

```tsx
<InteractiveVideo blockId="safety-video" title="Warehouse safety briefing" src="/media/sample-briefing.mp4" showVideoScore>
  <TimedCue atSeconds={3} label="PPE check" mustComplete>
    <TrueFalse checkId="iv-tf" question="PPE is required on the warehouse floor." answer={true} />
  </TimedCue>
  <TimedCue atSeconds={6} label="Reporting">
    <Text>Report spills and blocked aisles immediately.</Text>
  </TimedCue>
  <TimedCue atSeconds={8} label="Quick quiz" mustComplete>
    <TrueFalse checkId="iv-tf-2" question="Tailgating through secure doors is acceptable." answer={false} />
  </TimedCue>
</InteractiveVideo>
```
:::

:::{tab-item} AI prompt
:sync-group: component-interactive-video

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a InteractiveVideo block (H5P-style: Interactive Video) like this example inside the active <Lesson>:

<InteractiveVideo blockId="safety-video" title="Warehouse safety briefing" src="/media/sample-briefing.mp4" showVideoScore>
  <TimedCue atSeconds={3} label="PPE check" mustComplete>
    <TrueFalse checkId="iv-tf" question="PPE is required on the warehouse floor." answer={true} />
  </TimedCue>
  <TimedCue atSeconds={6} label="Reporting">
    <Text>Report spills and blocked aisles immediately.</Text>
  </TimedCue>
  <TimedCue atSeconds={8} label="Quick quiz" mustComplete>
    <TrueFalse checkId="iv-tf-2" question="Tailgating through secure doors is acceptable." answer={false} />
  </TimedCue>
</InteractiveVideo>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Packaging notes:
No manifest row for `InteractiveVideo` — author [`TimedCue`](timed-cue.md) children in React.
- Set **`blockId`** on the video compound when `persistCompoundState` is enabled.
- List each scored cue's **`checkId`** under `course.assessments[]`.
- Resume stores playback time and completed cue state.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync-group: component-interactive-video

No manifest row for `InteractiveVideo` — author [`TimedCue`](timed-cue.md) children in React.

- Set **`blockId`** on the video compound when `persistCompoundState` is enabled.
- List each scored cue's **`checkId`** under `course.assessments[]`.
- Resume stores playback time and completed cue state.
:::

::::
<!-- try-it:end -->
















## See also

- [interactive-video example](../../examples/index.md)
- [Block catalog — InteractiveVideo](../block-catalog.md)
