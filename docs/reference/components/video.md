# Video

:::{admonition} H5P equivalent
:class: tip

**H5P Self-hosted video**
:::

## When to use

Use `Video` for a **standalone self-hosted clip** inside a lesson — intros, demonstrations, or supplemental footage without timed overlays.

**Use [`InteractiveVideo`](interactive-video.md)** when learners must complete cues at timestamps.

## Requirements

- `src` must resolve under your embed/media allowlist in production.
- Optional `poster`, `captions` (WebVTT URL), and `title` for accessibility.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-video

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/video"
  title="Video component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/video" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-video

```tsx
<Video blockId="intro-video" src="/media/phishing-red-flags.mp4" title="Phishing red flags briefing" />
```
:::

:::{tab-item} AI prompt
:sync: component-video

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a Video block (H5P-style: Self-hosted video) like this example inside the active <Lesson>:

<Video blockId="intro-video" src="/media/phishing-red-flags.mp4" title="Phishing red flags briefing" />

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

- [Migration 1.3 → 1.4](../../MIGRATION-1.3-to-1.4.md)
