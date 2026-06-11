# AudioRecorder

:::{admonition} H5P equivalent
:class: tip

**H5P Audio Recorder**
:::

## When to use

Use `AudioRecorder` for **learner-recorded responses** — pronunciation practice, verbal commitments, or role-play reflection.

Requires browser `MediaRecorder` support and explicit consent via `consentLabel`.

## Requirements

- Learners must check consent before recording.
- Set `maxDurationSeconds` to cap clip length.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-audio-recorder

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/audio-recorder"
  title="AudioRecorder component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/audio-recorder" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-audio-recorder

```tsx
<AudioRecorder
  blockId="escalation-script"
  consentLabel="I consent to record audio for this practice exercise only."
  maxDurationSeconds={45}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-audio-recorder

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a AudioRecorder block (H5P-style: Audio Recorder) like this example inside the active <Lesson>:

<AudioRecorder
  blockId="escalation-script"
  consentLabel="I consent to record audio for this practice exercise only."
  maxDurationSeconds={45}
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




















## Touch behavior

Start and Stop recording buttons use `lk-button` for 44px minimum touch targets when base theme CSS is imported.

## See also

- [Essay](essay.md) — typed long-form responses
