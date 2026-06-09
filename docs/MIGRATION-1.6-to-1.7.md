# Migrating from LessonKit 1.6.x to 1.7.0

## Summary

| Area | 1.6.x | 1.7.0 |
| --- | --- | --- |
| Tier B P1 assessments | Planned | Four blocks + **Quiz variants** (multi-select, shuffle, feedback) |
| LXPack descriptor kinds | mcq, trueFalse, fillInBlanks, … | + `sortParagraphs`, `guessTheAnswer`, `multimediaChoice`; MCQ `answers` / `shuffleChoices` / `choiceFeedback` |
| Breaking API changes | — | **None** (additive minor) |

## New blocks

| H5P | LessonKit | Scored | LMS shell |
| --- | --- | --- | --- |
| Sort the Paragraphs | `SortParagraphs` | Yes | SPA-only (`kind: "sortParagraphs"`) |
| Guess the Answer | `GuessTheAnswer` | Optional (`scored={false}` reveal-only) | SPA-only when scored |
| Multimedia Choice | `MultimediaChoice` | Yes | Injectable via MCQ shell (`kind: "multimediaChoice"`) |
| Single Choice Set | `SingleChoiceSet` | Yes (aggregated) | Per-child MCQ descriptors |

### React usage

```tsx
<SortParagraphs
  checkId="steps-order"
  paragraphs={["Step A", "Step B", "Step C"]}
  correctOrder={[0, 1, 2]}
/>

<GuessTheAnswer checkId="term-guess" prompt="Policy acronym?" answer="GDPR" />

<MultimediaChoice
  checkId="channel-pick"
  question="Pick the approved channel"
  choices={[
    { label: "Portal", mediaUrl: "/portal.png", mediaKind: "image", altText: "Portal" },
  ]}
  answer="Portal"
/>

<SingleChoiceSet blockId="quick-set" showSetScore>
  <Quiz checkId="q1" question="Q1?" choices={["A", "B"]} answer="A" />
  <Quiz checkId="q2" question="Q2?" choices={["C", "D"]} answer="D" />
</SingleChoiceSet>
```

Every media choice **must** include non-empty `label` and `altText`. Audio choices require a text equivalent via `altText`.

## `lessonkit.json` descriptors

```json
{
  "kind": "sortParagraphs",
  "checkId": "steps-order",
  "question": "Order the steps",
  "paragraphs": ["Step A", "Step B"],
  "correctOrder": [0, 1],
  "passingScore": 2
}
```

- **`sortParagraphs`** and **`guessTheAnswer`**: validated for manifest parity; not injected into the LMS MCQ shell (SPA scoring + bridge). **Omit from `lessonkit.json`** when packaging SCORM/xAPI/cmi5 targets (same as `fillInBlanks`).
- **`multimediaChoice`**: maps to MCQ shell with choice labels; media is SPA-only.

`SingleChoiceSet` has no separate descriptor kind — declare each child `Quiz` in `assessments[]`.

## Quiz variants (H5P Multiple Choice)

Extended props on `Quiz` / `KnowledgeCheck` (additive — omit for 1.6.x behavior):

| Prop | Purpose |
| --- | --- |
| `answers?: string[]` | Multi-select when length > 1 (checkbox + **Check** button) |
| `shuffleChoices?: boolean` | Randomize display order in SPA |
| `shuffleSeed?: string \| number` | Stable shuffle (defaults to `checkId`) |
| `choiceFeedback?: Record<string, string>` | Per-choice feedback (keys = choice labels) |

```tsx
<Quiz
  checkId="hazards"
  question="Select all risks"
  choices={["Phishing", "Portal", "Tailgating"]}
  answer="Phishing"
  answers={["Phishing", "Tailgating"]}
  shuffleChoices
  choiceFeedback={{ Portal: "The IT portal is the approved channel." }}
/>
```

**Scoring:** `maxScore = answers.length`; score counts correct selections; pass requires meeting `passingScore` with **no incorrect** choice selected.

**Packaging:** `answers` is validated in `lessonkit.json` but **multi-select MCQ is SPA-only for LMS shell exports** until LXPack supports multiple correct choices in shell quizzes (omit from `assessments[]` when packaging to SCORM). `shuffleChoices`, `shuffleSeed`, and `choiceFeedback` are also SPA-only and do not block packaging when omitted.

## Upgrade checklist

1. Bump all `@lessonkit/*` packages to **1.7.0** (or latest **1.7.x** patch).
2. Run `npm install`.
3. `lessonkit build` and fix any TypeScript errors.
4. Add descriptors for new scored `checkId`s in `lessonkit.json`.
5. `lessonkit package --target scorm12` smoke test on your course.
6. Optional: `lessonkit blocks list --tier B --json` to inventory new entries.

## LMS delivery unchanged

`lessonkit package` targets (`scorm12`, `xapi`, `cmi5`, `standalone`) are unchanged. SPA-only assessments continue to score in React with bridge telemetry where configured.
