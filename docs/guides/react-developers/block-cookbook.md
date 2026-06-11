# Block cookbook

Minimal **React + `lessonkit.json`** pairs for common assessment blocks.

**Prefer component pages** for live demos and when-to-use guidance: [Component pages](../../reference/components/index.md) (each assessment page includes a **Packaging** section). Full contracts: [Block catalog](../../reference/block-catalog.md) · [Storybook](https://eddiethedean.github.io/lessonkit/storybook/).

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

On touch: tap a word, then tap a blank. See [Touch and mobile](touch-and-mobile.md).

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

On touch devices: tap an item to select it, then tap a target (pick-and-place). Import `@lessonkit/themes/base.css` for 44px chips. See [Touch and mobile](touch-and-mobile.md).

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

## SortParagraphs

`correctOrder` uses zero-based indices into `paragraphs`.

```tsx
<SortParagraphs
  checkId="steps-sort"
  paragraphs={["Contain", "Notify security", "Document"]}
  correctOrder={[0, 1, 2]}
/>
```

```json
{
  "checkId": "steps-sort",
  "kind": "sortParagraphs",
  "question": "Order the incident response steps",
  "paragraphs": ["Contain", "Notify security", "Document"],
  "correctOrder": [0, 1, 2]
}
```

SPA-only in LMS shell — omit from `assessments[]` when packaging SCORM/xAPI/cmi5 if you rely on shell scoring only.

## GuessTheAnswer

```tsx
<GuessTheAnswer checkId="term-guess" prompt="EU privacy acronym?" answer="GDPR" />
```

Reveal-only (no descriptor):

```tsx
<GuessTheAnswer scored={false} prompt="What does MFA stand for?" answer="Multi-factor authentication" />
```

```json
{
  "checkId": "term-guess",
  "kind": "guessTheAnswer",
  "question": "EU privacy acronym?",
  "answer": "GDPR"
}
```

## MultimediaChoice

Every choice needs `label`, `mediaUrl`, `mediaKind` (`image` | `audio`), and `altText`.

```tsx
<MultimediaChoice
  checkId="channel-mm"
  question="Which channel is approved?"
  choices={[
    {
      label: "Service portal",
      mediaUrl: "/media/portal.png",
      mediaKind: "image",
      altText: "IT service portal home screen",
    },
    {
      label: "Unknown email",
      mediaUrl: "/media/email.png",
      mediaKind: "image",
      altText: "Suspicious email screenshot",
    },
  ]}
  answer="Service portal"
/>
```

```json
{
  "checkId": "channel-mm",
  "kind": "multimediaChoice",
  "question": "Which channel is approved?",
  "choices": ["Service portal", "Unknown email"],
  "answer": "Service portal"
}
```

LMS shell uses labels only; media URLs are SPA-only.

## SingleChoiceSet

Container uses `blockId`. Declare each child `Quiz` in `course.assessments[]`.

```tsx
<SingleChoiceSet blockId="quick-set" title="Security basics" showSetScore>
  <Quiz checkId="scs-q1" question="Report phishing?" choices={["Yes", "No"]} answer="Yes" />
  <Quiz checkId="scs-q2" question="Share passwords?" choices={["Yes", "No"]} answer="No" />
</SingleChoiceSet>
```

```json
[
  {
    "checkId": "scs-q1",
    "kind": "mcq",
    "question": "Report phishing?",
    "choices": ["Yes", "No"],
    "answer": "Yes"
  },
  {
    "checkId": "scs-q2",
    "kind": "mcq",
    "question": "Share passwords?",
    "choices": ["Yes", "No"],
    "answer": "No"
  }
]
```

## AssessmentSequence

```tsx
<AssessmentSequence blockId="seq-1">
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
| `SortParagraphs` | All-or-nothing (exact order) | Intermediate `passingScore` values do not apply |
| `GuessTheAnswer` | All-or-nothing | Default = 1; `scored={false}` skips scoring |
| `MultimediaChoice` | All-or-nothing per attempt | Same as `Quiz` |
| `SingleChoiceSet` | Aggregates child `Quiz` scores | Children use `Quiz` model |
| `AssessmentSequence` | Aggregates child scores | Children use their own models |
| `BranchingScenario` | Visited-path aggregation | Terminal nodes contribute |

Use `enableRetry={false}` when the LMS should record a terminal failed attempt—see [Production checklist](production-checklist.md).

---

## InteractiveBook + Page

```tsx
<InteractiveBook blockId="onboarding-book" title="Employee handbook">
  <Page blockId="welcome" title="Welcome">
    <Text>Read the policy summary below.</Text>
  </Page>
  <Page blockId="quiz-page" title="Check">
    <Quiz checkId="book-quiz" question="Acknowledged?" choices={["No", "Yes"]} answer="Yes" />
  </Page>
</InteractiveBook>
```

`lessonkit.json`: list `book-quiz` under `course.assessments[]`. Compound blocks use `blockId` (not `checkId` on the container). Resume state persists when `config.session.persistCompoundState` is true.

## SlideDeck

```tsx
<SlideDeck blockId="onboarding-deck" title="Day one">
  <Slide blockId="slide-1" title="Intro">
    <Heading level={3}>Welcome</Heading>
  </Slide>
  <Slide blockId="slide-2">
    <TrueFalse checkId="deck-tf" question="PPE required?" answer={true} />
  </Slide>
</SlideDeck>
```

Add `deck-tf` to `course.assessments[]` with `"kind": "trueFalse"`.

## BranchingScenario

```tsx
<BranchingScenario blockId="escalation" title="Handle the complaint" startNodeId="start">
  <BranchNode nodeId="start" title="First response">
    <Text>How do you open the conversation?</Text>
    <BranchChoice targetNodeId="empathy" label="Acknowledge feelings" />
    <BranchChoice targetNodeId="deflect" label="Deflect blame" />
  </BranchNode>
  <BranchNode nodeId="empathy" terminal>
    <Text>Good path - customer calms down.</Text>
  </BranchNode>
  <BranchNode nodeId="deflect" terminal>
    <Text>Escalation risk increases.</Text>
  </BranchNode>
</BranchingScenario>
```

Branching scenarios do not require `assessments[]` entries unless you embed scored blocks inside nodes. Graph validation: `validateBranchGraph()` from `@lessonkit/core`. See [Core — branching](../../reference/core.md#branching-scenario-meta).
