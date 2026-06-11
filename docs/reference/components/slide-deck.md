# SlideDeck

:::{admonition} H5P equivalent
:class: tip

**H5P Course Presentation** — keyboard-navigable slides with optional deck-level scoring.
:::

## When to use

Use `SlideDeck` for **presentation-style** lessons — onboarding briefings, visual walkthroughs, or conference-style content with one idea per slide.

Children must be [`Slide`](../block-catalog.md) blocks. Enable `showDeckScore` when slides contain scored children and you want aggregate feedback.

The demo uses `Heading`, `Text`, and `TrueFalse` across two slides.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-slide-deck

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/slide-deck"
  title="SlideDeck component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/slide-deck" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-slide-deck

```tsx
<SlideDeck blockId="onboarding-deck" title="Phishing red flags" showDeckScore>
  <Slide blockId="deck-welcome" title="Welcome">
    <Heading level={2}>Spot the red flags</Heading>
    <Text>Sender impersonation, urgency tactics, and safe reporting.</Text>
  </Slide>
  <Slide blockId="deck-check" title="Check">
    <TrueFalse checkId="deck-tf" question="Urgent language alone proves an email is malicious." answer={false} />
  </Slide>
</SlideDeck>
```
:::

:::{tab-item} AI prompt
:sync: component-slide-deck

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a SlideDeck block (H5P-style: Course Presentation) like this example inside the active <Lesson>:

<SlideDeck blockId="onboarding-deck" title="Phishing red flags" showDeckScore>
  <Slide blockId="deck-welcome" title="Welcome">
    <Heading level={2}>Spot the red flags</Heading>
    <Text>Sender impersonation, urgency tactics, and safe reporting.</Text>
  </Slide>
  <Slide blockId="deck-check" title="Check">
    <TrueFalse checkId="deck-tf" question="Urgent language alone proves an email is malicious." answer={false} />
  </Slide>
</SlideDeck>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Packaging notes:
No `lessonkit.json` row for `SlideDeck` — compose slides in React.
- Set **`blockId`** on `SlideDeck` and each **`Slide`** when `persistCompoundState` is enabled.
- Add child assessment **`checkId`** values (for example `deck-tf`) under `course.assessments[]`.
- Resume persists active slide index and child assessment state.

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Packaging
:sync: component-slide-deck

No `lessonkit.json` row for `SlideDeck` — compose slides in React.

- Set **`blockId`** on `SlideDeck` and each **`Slide`** when `persistCompoundState` is enabled.
- Add child assessment **`checkId`** values (for example `deck-tf`) under `course.assessments[]`.
- Resume persists active slide index and child assessment state.
:::

::::
<!-- try-it:end -->




















## Touch behavior

Previous and Next slide navigation uses shared `CompoundNav` with `lk-button` controls (44px minimum height) when `@lessonkit/themes/base.css` is imported.

## See also

- [slide-deck example](../../examples/index.md#slide-deck-examplesslide-deck)
- [Block catalog — SlideDeck](../block-catalog.md)
