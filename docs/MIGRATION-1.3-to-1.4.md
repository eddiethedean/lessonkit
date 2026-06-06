# Migrating from LessonKit 1.3.x to 1.4.0

## Summary

| Area | 1.3.x | 1.4.0 |
| --- | --- | --- |
| Content primitive | — | + `Video` (self-hosted `<video>`, optional WebVTT captions) |
| Compound containers | `SlideDeck`, `InteractiveBook`, … | + `InteractiveVideo`, `TimedCue` (H5P Interactive Video) |
| Assessments | P0 + hotspots | + `Summary`, `ImagePairing`, `ImageSequencing`, `ArithmeticQuiz`, `Essay` |
| Content blocks | Tier C/D (1.2) | + `MemoryGame`, `InformationWall`, `ParallaxSlideshow`, `Questionnaire` |
| Telemetry catalog v3 | `slide_viewed`, … | + `video_cue_reached`, `video_segment_completed`, block interaction events |
| Block catalog v3 | 26 entries | + 12 new block types (38 total) |

## Additive API

```tsx
import {
  Video,
  InteractiveVideo,
  TimedCue,
  Summary,
  MemoryGame,
} from "@lessonkit/react";
```

Interactive video example:

```tsx
<InteractiveVideo blockId="safety-briefing" title="PPE overview" src="/video/ppe.mp4" showVideoScore>
  <TimedCue atSeconds={30} label="Check" mustComplete>
    <TrueFalse checkId="ppe-tf" question="PPE required?" answer={true} />
  </TimedCue>
  <TimedCue atSeconds={120}>
    <Summary checkId="ppe-summary" statements={[...]} correct={[...]} />
  </TimedCue>
</InteractiveVideo>
```

`InteractiveVideo` implements `CompoundHandle` (score aggregation, session resume) including video `currentTime` and completed cue indices.

## Allowlists

- `Slide` and `Page` accept `Video`, `Summary`, and other 1.4 blocks per [H5P capability map](project/h5p-capability-map.md).
- `TimedCue` accepts scored and content blocks listed in `@lessonkit/core` `TIMED_CUE_ALLOWED_CHILD_TYPES` (excludes `ParallaxSlideshow`, `InformationWall`, `Video`).
- `InteractiveVideo` accepts `TimedCue` children only.

## Telemetry

- `InteractiveVideo` emits `video_cue_reached` and `video_segment_completed`.
- Content blocks emit `memory_card_flipped`, `information_wall_search`, `parallax_slide_viewed`, `questionnaire_submitted` as documented in [Telemetry reference](reference/telemetry.md).

## `lessonkit.json`

- Scored children still use `assessments[]` with `checkId` (unchanged from 1.3.x).
- Compound `blockId` values on `InteractiveVideo` are not LMS `lessonId`s.

## Golden example

[`examples/interactive-video`](https://github.com/eddiethedean/lessonkit/tree/main/examples/interactive-video) demonstrates `InteractiveVideo` with `TimedCue`, plus `Video`, `MemoryGame`, and `InformationWall`.

## Essay grading

`Essay` returns score `0` until a `scoreAssessment` plugin or manual grading workflow assigns a score. See [production checklist](guides/react-developers/production-checklist.md).
