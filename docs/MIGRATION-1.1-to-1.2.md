# Migrating from LessonKit 1.1.x to 1.2.0

## Summary

| Area | 1.1.x | 1.2.0 |
| --- | --- | --- |
| Compound containers | `AssessmentSequence` (navigation only) | `Page`, `InteractiveBook`, full `CompoundHandle` on sequences |
| Resume state | — | `getCurrentState` / `resume` on assessments; session storage for compounds |
| Content blocks | Studio-only primitives | Framework `Text`, `Heading`, `Image` |
| Tier C/D (H5P) | — | `Accordion`, `DialogCards`, `Flashcards`, `ImageHotspots`, `ImageSlider`, `FindHotspot`, `FindMultipleHotspots` |
| Block catalog | v2 default | **v3 default** (`buildBlockCatalog({ version: 3 })`) |
| Telemetry | v1 + v2 assessment events | + v3 compound/content events (`book_page_viewed`, …) |

## Additive API

```tsx
import {
  Text,
  Heading,
  Image,
  Page,
  InteractiveBook,
  Accordion,
  DialogCards,
  Flashcards,
  ImageHotspots,
  ImageSlider,
  FindHotspot,
  FindMultipleHotspots,
} from "@lessonkit/react";
import type { CompoundHandle } from "@lessonkit/react";
```

## Block catalog v3

Generators pinned to v2 should opt in explicitly until updated:

```ts
import { buildBlockCatalog } from "@lessonkit/react";

const v2 = buildBlockCatalog({ version: 2 });
const v3 = buildBlockCatalog({ version: 3 }); // default in 1.2.0
```

Import `@lessonkit/react/block-catalog.v3.json` for machine-readable entries including `allowedChildTypes` and `compoundContract`.

## Session / resume

`LessonkitConfig.session.persistCompoundState` defaults to `true`. Compound containers restore `activePageIndex` from `sessionStorage` on mount and persist on navigation or when child assessment state changes.

Child answer state is restored when the assessment block implements `getCurrentState` / `resume` (all 1.1.x P0 assessments and 1.2.x scored blocks, including `FindHotspot` / `FindMultipleHotspots`). Set `blockId` on `AssessmentSequence` when using persistence — multiple sequences without `blockId` share one storage key.

## `lessonkit.json`

- Compound `blockId` values are **not** LMS `lessonId`s.
- Scored children still use `assessments[]` with `checkId`.
- New optional kinds: `findHotspot`, `findMultipleHotspots` (see `@lessonkit/lxpack` types).
- When `persistCompoundState` is enabled, provide a unique `blockId` on each `AssessmentSequence`.

## AssessmentSequence behavior

`AssessmentSequence` now implements `CompoundHandle` and aggregates child scores when used with a ref. This may surface parent-level scores where previously only children reported.
