# Assessment blocks (P0 + 1.7.0)

Compact showcase of P0 assessment interactions and **1.7.0 Tier B P1** blocks inside `AssessmentSequence` and `SingleChoiceSet`.

## What to look at in `App.tsx`

- `AssessmentSequence` wrapping P0 blocks plus `SortParagraphs`, `GuessTheAnswer`, and `MultimediaChoice`.
- `SingleChoiceSet` with two `Quiz` children and aggregated `showSetScore`.
- `courseId` **`assessments-p0-demo`** — compare with the fuller catalogs in `framework-11-showcase` and `framework-12-showcase`.

## Run

```bash
npm run build:packages   # from repo root
npm -w lessonkit-example-assessments-p0 run dev
```

## LXPack notes

- `multimediaChoice` and SingleChoiceSet child MCQs are injectable in the LMS shell.
- `sortParagraphs` and `guessTheAnswer` descriptors are SPA-only (scored in React).
