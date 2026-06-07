# Block cookbook

Minimal **React + `lessonkit.json`** pairs for common assessment blocks. Full contracts: [Block catalog](../../reference/block-catalog.md) · [Storybook](https://eddiethedean.github.io/lessonkit/storybook/).

Every assessment must live inside `<Lesson>` and use stable IDs aligned with the manifest.

## TrueFalse

```tsx
<TrueFalse
  checkId="tf-1"
  question="Phishing emails often use urgent language."
  answer={true}
/>
```

```json
{
  "checkId": "tf-1",
  "kind": "trueFalse",
  "question": "Phishing emails often use urgent language.",
  "answer": true
}
```

## Quiz

```tsx
<Quiz
  checkId="quiz-1"
  question="What should you verify first?"
  choices={["Open the attachment", "Verify the sender"]}
  answer="Verify the sender"
/>
```

```json
{
  "checkId": "quiz-1",
  "kind": "mcq",
  "question": "What should you verify first?",
  "choices": ["Open the attachment", "Verify the sender"],
  "answer": "Verify the sender"
}
```

## FillInTheBlanks

Wrap answers in `*` in the template string.

```tsx
<FillInTheBlanks
  checkId="fib-1"
  template="The *capital* of France is *Paris*."
/>
```

```json
{
  "checkId": "fib-1",
  "kind": "fillInBlanks",
  "question": "The capital of France is Paris.",
  "blanks": [
    { "id": "blank-0", "answer": "capital" },
    { "id": "blank-1", "answer": "Paris" }
  ]
}
```

## DragTheWords

```tsx
<DragTheWords
  checkId="dtw-1"
  template="I like *cats* and *dogs*."
  words={["cats", "dogs", "birds"]}
/>
```

```json
{
  "checkId": "dtw-1",
  "kind": "dragTheWords",
  "question": "I like cats and dogs.",
  "zones": ["cats", "dogs"]
}
```

## DragAndDrop

```tsx
<DragAndDrop
  checkId="dad-1"
  items={[
    { id: "apple", label: "Apple" },
    { id: "carrot", label: "Carrot" }
  ]}
  targets={[
    { id: "fruit", label: "Fruit", accepts: "apple" },
    { id: "veg", label: "Vegetable", accepts: "carrot" }
  ]}
/>
```

```json
{
  "checkId": "dad-1",
  "kind": "dragAndDrop",
  "question": "Sort produce",
  "items": ["apple", "carrot"],
  "targets": ["fruit", "veg"]
}
```

## MarkTheWords

```tsx
<MarkTheWords
  checkId="mtw-1"
  text="Click the verbs in this sentence."
  correctWords={["Click"]}
/>
```

```json
{
  "checkId": "mtw-1",
  "kind": "markTheWords",
  "question": "Click the verbs in this sentence.",
  "correctWords": ["Click"]
}
```

## AssessmentSequence

```tsx
<AssessmentSequence checkId="seq-1">
  <TrueFalse checkId="seq-tf" question="Ready?" answer={true} />
  <Quiz checkId="seq-quiz" question="Pick one" choices={["A", "B"]} answer="B" />
</AssessmentSequence>
```

List each child `checkId` under `course.assessments[]` in `lessonkit.json`.

---

## Scoring semantics

How `passingScore` and partial credit behave per block. Source: block implementations and `meetsPassingThreshold`.

| Block | Scoring model | `passingScore` notes |
| --- | --- | --- |
| `Quiz` / `KnowledgeCheck` | All-or-nothing per attempt | Default = full credit (1 point) |
| `TrueFalse` | All-or-nothing | Default = 1 |
| `FillInTheBlanks` | Per-blank partial credit | Intermediate thresholds supported |
| `DragTheWords` | Per-zone partial credit | Intermediate thresholds supported |
| `DragAndDrop` | Per-target partial credit | Intermediate thresholds supported |
| `MarkTheWords` | Per-word partial credit | Intermediate thresholds supported |
| `FindMultipleHotspots` | Per-correct hotspot; **wrong extra selections fail** | Decoys cannot pass on correct count alone |
| `FindHotspot` | All-or-nothing | Single target |
| `ImageSequencing` | All-or-nothing (exact order) | Intermediate `passingScore` values do not apply |
| `Summary` | All-or-nothing (exact statement order) | Intermediate `passingScore` values do not apply |
| `ImagePairing` | Per-pair partial credit | Threshold can pass before all pairs matched |
| `ArithmeticQuiz` | Per-prompt partial credit | Timed mode supported |
| `AssessmentSequence` | Aggregates child scores | Children use their own models |
| `BranchingScenario` | Visited-path aggregation | Terminal nodes contribute |

Use `enableRetry={false}` when the LMS should record a terminal failed attempt—see [Production checklist](production-checklist.md).
