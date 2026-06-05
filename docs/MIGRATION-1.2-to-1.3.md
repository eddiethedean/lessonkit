# Migrating from LessonKit 1.2.x to 1.3.0

## Summary

| Area | 1.2.x | 1.3.0 |
| --- | --- | --- |
| Compound containers | `Page`, `InteractiveBook`, `AssessmentSequence` | + `Slide`, `SlideDeck` (H5P Course Presentation) |
| Slide navigation | — | Keyboard: Arrow keys, Home, End |
| Telemetry | v3 (`book_page_viewed`, …) | + `slide_viewed` |
| Block catalog v3 | 24 entries | + `Slide`, `SlideDeck` |

## Additive API

```tsx
import { Slide, SlideDeck } from "@lessonkit/react";
import type { CompoundHandle } from "@lessonkit/react";
```

Example:

```tsx
<SlideDeck blockId="onboarding-deck" title="New hire onboarding" showDeckScore>
  <Slide blockId="slide-intro" title="Welcome">
    <Text>Welcome aboard.</Text>
  </Slide>
  <Slide blockId="slide-quiz" title="Check">
    <TrueFalse checkId="ppe-tf" question="PPE required?" answer={true} />
  </Slide>
</SlideDeck>
```

`SlideDeck` implements `CompoundHandle` (score aggregation, resume, session persistence) using the same machinery as `InteractiveBook`.

## Slide allowlist

`Slide` children mirror `Page` minus `ProgressTracker`. Nested compounds (`Page`, `InteractiveBook`, `SlideDeck`, `AssessmentSequence`) are excluded. Planned expansions: `Video`, `Summary` (see [H5P capability map](project/h5p-capability-map.md)).

## Telemetry

- `SlideDeck` emits `slide_viewed` with `{ blockId, slideIndex, slideTitle }`.
- Each visible `Slide` emits `compound_page_viewed` with `parentType: "SlideDeck"`.

## `lessonkit.json`

- Compound `blockId` values on `SlideDeck` are not LMS `lessonId`s.
- Scored children still use `assessments[]` with `checkId` (unchanged from 1.2.x).

## Golden example

[`examples/slide-deck`](../examples/slide-deck/) demonstrates a four-slide deck with `TrueFalse` scoring and `lessonkit.json` parity.
