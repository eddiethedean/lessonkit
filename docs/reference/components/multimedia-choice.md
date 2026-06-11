# MultimediaChoice

:::{admonition} H5P equivalent
:class: tip

**H5P Multimedia Choice**
:::

## When to use

Use `MultimediaChoice` for **multiple choice with image or audio options** — each choice can include media alongside a label.

Set `kind: "multimediaChoice"` in `lessonkit.json` when packaging.

## Requirements

- Requires `checkId` inside `Lesson`.
- Props and telemetry: [block catalog — MultimediaChoice](../block-catalog.md).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-multimedia-choice

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/multimedia-choice"
  title="MultimediaChoice component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/multimedia-choice" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-multimedia-choice

```tsx
<MultimediaChoice
  checkId="channel-mm"
  question="Which channel is approved for IT requests?"
  choices={[
    {
      label: "Service portal",
      mediaUrl: "/media/service-portal.png",
      mediaKind: "image",
      altText: "Corporate service portal home screen",
    },
    {
      label: "Unknown email link",
      mediaUrl: "/media/suspicious-email.png",
      mediaKind: "image",
      altText: "Suspicious email screenshot",
    },
  ]}
  answer="Service portal"
/>
```
:::

:::{tab-item} AI prompt
:sync: component-multimedia-choice

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a MultimediaChoice block (H5P-style: Multimedia Choice) like this example inside the active <Lesson>:

<MultimediaChoice
  checkId="channel-mm"
  question="Which channel is approved for IT requests?"
  choices={[
    {
      label: "Service portal",
      mediaUrl: "/media/service-portal.png",
      mediaKind: "image",
      altText: "Corporate service portal home screen",
    },
    {
      label: "Unknown email link",
      mediaUrl: "/media/suspicious-email.png",
      mediaKind: "image",
      altText: "Suspicious email screenshot",
    },
  ]}
  answer="Service portal"
/>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
Sync lessonkit.json — add under course.assessments[]:

{
  "checkId": "channel-mm",
  "kind": "multimediaChoice",
  "question": "Which channel is approved for IT requests?",
  "choices": ["Service portal", "Unknown email link"],
  "answer": "Service portal"
}

- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

:::{tab-item} Manifest
:sync: component-multimedia-choice

Injectable via MCQ shell (`kind: "multimediaChoice"`). Media URLs are SPA-only; labels must match React props.

```json
{
  "checkId": "channel-mm",
  "kind": "multimediaChoice",
  "question": "Which channel is approved for IT requests?",
  "choices": ["Service portal", "Unknown email link"],
  "answer": "Service portal"
}
```
:::

::::
<!-- try-it:end -->



## Touch behavior

Radio rows use `lk-quiz-choice` sizing. Image thumbnails scale down on narrow viewports; labels remain the tappable primary target.

## Audio choices

Set `mediaKind: "audio"` for spoken options. Every choice needs non-empty `label` and `altText` (text equivalent for screen readers):

```tsx
<MultimediaChoice
  checkId="tone-mm"
  question="Which clip matches our verified callback greeting?"
  choices={[
    {
      label: "Standard verification",
      mediaUrl: "/media/callback-good.mp3",
      mediaKind: "audio",
      altText: "Agent confirms account number before discussing charges",
    },
    {
      label: "Pressure tactic",
      mediaUrl: "/media/callback-bad.mp3",
      mediaKind: "audio",
      altText: "Caller demands immediate payment without verification",
    },
  ]}
  answer="Standard verification"
/>
```

## LMS shell vs SPA media

`kind: "multimediaChoice"` injects into the LMS MCQ shell using **choice labels only**. Image and audio URLs render in the SPA — host assets under your production media allowlist. Labels in `lessonkit.json` must match React props exactly.

## See also

- [Quiz](quiz.md) — text-only multiple choice
- [Block catalog — MultimediaChoice](../block-catalog.md)
- [Block cookbook — MultimediaChoice](../../guides/react-developers/block-cookbook.md#multimediachoice)
- [Assessment showcase](../../examples/index.md#assessment-showcase-examplesassessments-p0)

