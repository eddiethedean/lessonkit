# ParallaxSlideshow

:::{admonition} H5P equivalent
:class: tip

**H5P Parallax**
:::

## When to use

Use `ParallaxSlideshow` for **storytelling slides** with title, body, and optional background imagery. Respects `prefers-reduced-motion`.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync-group: component-parallax-slideshow

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/parallax-slideshow"
  title="ParallaxSlideshow component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/parallax-slideshow" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync-group: component-parallax-slideshow

```tsx
<ParallaxSlideshow
  blockId="program-story"
  slides={[
    { title: "Baseline training", body: "Annual phishing modules for all staff." },
    { title: "Simulations", body: "Quarterly drills with coaching." },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync-group: component-parallax-slideshow

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a ParallaxSlideshow block (H5P-style: Parallax) like this example inside the active <Lesson>:

<ParallaxSlideshow
  blockId="program-story"
  slides={[
    { title: "Baseline training", body: "Annual phishing modules for all staff." },
    { title: "Simulations", body: "Quarterly drills with coaching." },
  ]}
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

- [SlideDeck](slide-deck.md) — structured deck with assessments
