import { buildV3CatalogFromV2 } from "./catalogV3Entries";
import { tierForBlockType } from "./blockTiers";

export const blockCatalogVersion = 1 as const;
export const blockCatalogV2Version = 2 as const;
export const blockCatalogV3Version = 3 as const;

export type BlockPropSpec = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export type BlockCatalogEntryBase = {
  type: string;
  aliases?: string[];
  category: "container" | "content" | "assessment" | "chrome";
  description: string;
  props: BlockPropSpec[];
  requiredIds: string[];
  optionalIds?: string[];
  parentConstraints?: string[];
  a11y: {
    element: string;
    ariaLabel: string;
    keyboard: string;
    liveRegions?: string;
    notes: string;
  };
  theming: {
    surface: "global-inherit";
    dataAttributes?: string[];
    stylingNotes: string;
  };
  telemetry: {
    emits: string[];
    requiresActiveLesson?: boolean;
    manualTracking?: string;
  };
};

export type BlockCatalogEntry = BlockCatalogEntryBase;

export type BlockCatalogEntryV2 = BlockCatalogEntryBase & {
  assessmentContract?: true;
  compoundContract?: true;
  h5pMachineName?: string;
  h5pAlias?: string;
  allowedChildTypes?: readonly string[];
  maxNestingDepth?: number;
};

export type BlockCatalogEntryV3 = BlockCatalogEntryV2 & {
  tier?: "A" | "B" | "C" | "D" | "E";
};

export const BLOCK_CATALOG = [
  {
    type: "Course",
    category: "container",
    description: "Top-level course shell; wraps LessonkitProvider and emits course lifecycle telemetry.",
    props: [
      { name: "title", type: "string", required: true, description: "Course title shown in the h1." },
      { name: "courseId", type: "CourseId", required: true, description: "Stable course identifier for telemetry and packaging." },
      {
        name: "config",
        type: "Omit<LessonkitConfig, 'courseId'>",
        required: false,
        description: "Runtime config (tracking, xAPI, session, lxpack bridge). courseId is merged from props.",
      },
      { name: "children", type: "ReactNode", required: true, description: "Lessons and course chrome." },
    ],
    requiredIds: ["courseId"],
    a11y: {
      element: "section",
      ariaLabel: "title prop",
      keyboard: "No block-specific keyboard behavior; focus flows to child content.",
      notes: "Renders h1 with course title. Wrap with ThemeProvider at app root for theming.",
    },
    theming: {
      surface: "global-inherit",
      stylingNotes: "Inherits --lk-* CSS variables from ThemeProvider on document or scoped host.",
    },
    telemetry: {
      emits: ["course_started", "course_completed"],
    },
  },
  {
    type: "Lesson",
    category: "container",
    description: "Lesson container; sets active lesson on mount and completes on unmount.",
    props: [
      { name: "title", type: "string", required: true, description: "Lesson title shown in the h2." },
      { name: "lessonId", type: "LessonId", required: true, description: "Stable lesson identifier for telemetry and packaging." },
      {
        name: "autoCompleteOnUnmount",
        type: "boolean",
        required: false,
        description: "When false, unmount does not emit lesson_completed (default true).",
      },
      { name: "children", type: "ReactNode", required: true, description: "Scenario, Quiz, Reflection, and other blocks." },
    ],
    requiredIds: ["lessonId"],
    parentConstraints: ["Course"],
    a11y: {
      element: "article",
      ariaLabel: "title prop",
      keyboard: "No block-specific keyboard behavior; focus flows to child content.",
      notes: "Renders h2 with lesson title. Only one Lesson should be mounted as active at a time in typical SPA layouts.",
    },
    theming: {
      surface: "global-inherit",
      stylingNotes: "Inherits --lk-* CSS variables from ThemeProvider.",
    },
    telemetry: {
      emits: ["lesson_started", "lesson_completed", "lesson_time_on_task"],
    },
  },
  {
    type: "Scenario",
    category: "content",
    description: "Scenario or narrative content region for branching stories and situational context.",
    props: [
      { name: "blockId", type: "BlockId", required: false, description: "Optional stable block id for interaction telemetry URNs." },
      { name: "children", type: "ReactNode", required: true, description: "Scenario narrative and custom UI." },
    ],
    requiredIds: [],
    optionalIds: ["blockId"],
    parentConstraints: ["Lesson"],
    a11y: {
      element: "section",
      ariaLabel: "Scenario",
      keyboard: "No block-specific keyboard behavior; custom children may define their own.",
      notes: "Use for situational framing. Pair with useTracking() for branching interactions.",
    },
    theming: {
      surface: "global-inherit",
      dataAttributes: ["data-lk-block-id"],
      stylingNotes: "Optional data-lk-block-id when blockId is set. Style via app CSS using --lk-* tokens.",
    },
    telemetry: {
      emits: [],
      manualTracking: "useTracking().track('interaction', { kind, blockId, payload })",
    },
  },
  {
    type: "Reflection",
    category: "content",
    description: "Reflection prompt with a textarea for learner free-text responses.",
    props: [
      { name: "blockId", type: "BlockId", required: false, description: "Optional stable block id for interaction telemetry URNs." },
      { name: "prompt", type: "string", required: false, description: "Reflection question or instruction." },
      { name: "hint", type: "string", required: false, description: "Optional hint linked via aria-describedby." },
      { name: "value", type: "string", required: false, description: "Controlled textarea value." },
      { name: "onChange", type: "(value: string) => void", required: false, description: "Called when the learner edits the textarea." },
      { name: "children", type: "ReactNode", required: false, description: "Optional content above the textarea." },
    ],
    requiredIds: [],
    optionalIds: ["blockId"],
    parentConstraints: ["Lesson"],
    a11y: {
      element: "section",
      ariaLabel: "Reflection",
      keyboard: "Textarea is keyboard-focusable; standard text entry.",
      notes: "When prompt is set, textarea uses aria-labelledby; otherwise aria-label='Reflection response'.",
    },
    theming: {
      surface: "global-inherit",
      dataAttributes: ["data-lk-block-id"],
      stylingNotes: "Optional data-lk-block-id when blockId is set. Style textarea via app CSS.",
    },
    telemetry: {
      emits: [],
      requiresActiveLesson: true,
      manualTracking: "useTracking().track('interaction', { kind, blockId, payload }) on submit or blur",
    },
  },
  {
    type: "Quiz",
    aliases: ["KnowledgeCheck"],
    category: "assessment",
    description: "Single-question multiple-choice assessment with automatic answer and completion telemetry.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check identifier for telemetry and LXPack assessments." },
      { name: "question", type: "string", required: true, description: "Question text shown above choices." },
      { name: "choices", type: "string[]", required: true, description: "Radio button choice labels." },
      { name: "answer", type: "string", required: true, description: "Correct choice value (must match one choice)." },
      { name: "answers", type: "string[]", required: false, description: "When length > 1, enables multi-select checkbox mode." },
      { name: "shuffleChoices", type: "boolean", required: false, description: "Randomize choice order in the SPA." },
      { name: "shuffleSeed", type: "string | number", required: false, description: "Stable shuffle seed (defaults to checkId)." },
      { name: "choiceFeedback", type: "Record<string, string>", required: false, description: "Per-choice feedback announced on selection." },
      {
        name: "passingScore",
        type: "number",
        required: false,
        description: "Minimum score required to pass (defaults to maxScore when omitted).",
      },
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson"],
    a11y: {
      element: "section",
      ariaLabel: "Quiz",
      keyboard: "Radio group (single-select) or checkbox group (multi-select); Check required for multi-select.",
      liveRegions: "role='status' aria-live='polite' for Correct / Try again and per-choice feedback.",
      notes: "Fieldset with visually hidden legend. KnowledgeCheck is an alias that renders Quiz with identical behavior.",
    },
    theming: {
      surface: "global-inherit",
      dataAttributes: ["data-lk-check-id"],
      stylingNotes: "data-lk-check-id set from checkId. Style labels and feedback via app CSS.",
    },
    telemetry: {
      emits: ["quiz_answered", "quiz_completed"],
      requiresActiveLesson: true,
    },
  },
  {
    type: "ProgressTracker",
    category: "chrome",
    description: "Displays count of completed lessons from runtime progress state.",
    props: [
      {
        name: "totalLessons",
        type: "number",
        required: false,
        description: "When set, renders role=progressbar with aria-valuenow/max.",
      },
    ],
    requiredIds: [],
    parentConstraints: ["Course"],
    a11y: {
      element: "aside",
      ariaLabel: "Progress",
      keyboard: "Presentational; no interactive elements.",
      notes: "Shows 'Lessons completed: N' from progress.completedLessonIds.",
    },
    theming: {
      surface: "global-inherit",
      stylingNotes: "Inherits --lk-* CSS variables; style via app CSS.",
    },
    telemetry: {
      emits: [],
    },
  },
] satisfies BlockCatalogEntry[];

const assessmentBehaviourProps: BlockPropSpec[] = [
  { name: "enableRetry", type: "boolean", required: false, description: "Allow retry after completion." },
  { name: "enableSolutionsButton", type: "boolean", required: false, description: "Show solution control." },
  { name: "autoCheck", type: "boolean", required: false, description: "Check answers automatically when possible." },
  { name: "passingScore", type: "number", required: false, description: "Minimum score to pass." },
];

const v2AssessmentEntries = [
  {
    type: "TrueFalse",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.TrueFalse",
    h5pAlias: "True/False",
    description: "Binary true/false question with assessment contract.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "question", type: "string", required: true, description: "Question text." },
      { name: "answer", type: "boolean", required: true, description: "Correct answer." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence"],
    a11y: {
      element: "section",
      ariaLabel: "True or False",
      keyboard: "Radio group with True/False options.",
      liveRegions: "role='status' for feedback.",
      notes: "H5P True/False equivalent.",
    },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "FillInTheBlanks",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.Blanks",
    h5pAlias: "Fill in the Blanks",
    description: "Fill-in-the-blank text with *answer* markers in template.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "template", type: "string", required: true, description: "Text with *blank* markers." },
      { name: "blanks", type: "FillInBlankSpec[]", required: false, description: "Explicit blank specs." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence"],
    a11y: {
      element: "section",
      ariaLabel: "Fill in the Blanks",
      keyboard: "Tab between text inputs.",
      notes: "H5P Fill in the Blanks equivalent.",
    },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "DragAndDrop",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.DragQuestion",
    h5pAlias: "Drag and Drop",
    description: "Drag items onto labeled targets.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "items", type: "DragItem[]", required: true, description: "Draggable items." },
      { name: "targets", type: "DropTarget[]", required: true, description: "Drop targets." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence"],
    a11y: {
      element: "section",
      ariaLabel: "Drag and Drop",
      keyboard: "Select item then activate target; drag also supported.",
      notes: "H5P Drag and Drop equivalent.",
    },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "DragTheWords",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.DragText",
    h5pAlias: "Drag the Words",
    description: "Drag words into inline blanks.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "template", type: "string", required: true, description: "Sentence with *blank* zones." },
      { name: "words", type: "string[]", required: true, description: "Draggable word bank." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence"],
    a11y: {
      element: "section",
      ariaLabel: "Drag the Words",
      keyboard: "Select word then activate zone.",
      notes: "H5P Drag the Words equivalent.",
    },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "MarkTheWords",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.MarkTheWords",
    h5pAlias: "Mark the Words",
    description: "Select correct words in a sentence.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "text", type: "string", required: true, description: "Source text." },
      { name: "correctWords", type: "string[]", required: true, description: "Words to mark." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence"],
    a11y: {
      element: "section",
      ariaLabel: "Mark the Words",
      keyboard: "Toggle words with buttons.",
      notes: "H5P Mark the Words equivalent.",
    },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "AssessmentSequence",
    category: "container" as const,
    h5pMachineName: "H5P.QuestionSet",
    h5pAlias: "Question Set",
    description: "Ordered sequence of contract-compliant assessments.",
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Assessment blocks." },
      { name: "sequential", type: "boolean", required: false, description: "One question at a time." },
      ...assessmentBehaviourProps.filter((p) => p.name !== "passingScore"),
    ],
    requiredIds: [],
    parentConstraints: ["Lesson"],
    a11y: {
      element: "section",
      ariaLabel: "Assessment sequence",
      keyboard: "Previous/Next navigation between steps.",
      notes: "H5P Question Set equivalent.",
    },
    theming: { surface: "global-inherit" as const, stylingNotes: "Container for assessments." },
    telemetry: { emits: [], manualTracking: "Child assessments emit assessment_* events." },
  },
  {
    type: "Summary",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.Summary",
    h5pAlias: "Summary",
    description: "Construct a summary from a statement bank in correct order.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "statements", type: "string[]", required: true, description: "Available statements." },
      { name: "correct", type: "string[]", required: true, description: "Correct ordered summary." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence", "TimedCue"],
    a11y: { element: "section", ariaLabel: "Summary", keyboard: "Select statements in order.", notes: "H5P Summary equivalent." },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "ImagePairing",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.ImagePair",
    h5pAlias: "Image Pairing",
    description: "Match image pairs in a memory-style task.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "pairs", type: "ImagePair[]", required: true, description: "Image pairs to match." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence", "TimedCue"],
    a11y: { element: "section", ariaLabel: "Image Pairing", keyboard: "Select two cards to match.", notes: "H5P Image Pairing equivalent." },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "ImageSequencing",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.ImageSequencing",
    h5pAlias: "Image Sequencing",
    description: "Order images in the correct sequence.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "images", type: "SequencingImage[]", required: true, description: "Images to order." },
      { name: "correctOrder", type: "string[]", required: true, description: "Correct id order." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence", "TimedCue"],
    a11y: { element: "section", ariaLabel: "Image Sequencing", keyboard: "Reorder with up/down.", notes: "H5P Image Sequencing equivalent." },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "ArithmeticQuiz",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.ArithmeticQuiz",
    h5pAlias: "Arithmetic Quiz",
    description: "Timed arithmetic problems with optional timer.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "problems", type: "ArithmeticProblem[]", required: true, description: "Math problems." },
      { name: "timeLimitSeconds", type: "number", required: false, description: "Optional time limit." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence", "TimedCue"],
    a11y: { element: "section", ariaLabel: "Arithmetic Quiz", keyboard: "Text input per problem.", notes: "H5P Arithmetic Quiz equivalent." },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "Essay",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.Essay",
    h5pAlias: "Essay",
    description: "Open text response; manual or plugin grading.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "question", type: "string", required: true, description: "Essay prompt." },
      { name: "minLength", type: "number", required: false, description: "Minimum character length." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence", "TimedCue"],
    a11y: { element: "section", ariaLabel: "Essay", keyboard: "Textarea input.", notes: "H5P Essay equivalent." },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "SortParagraphs",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.SortParagraphs",
    h5pAlias: "Sort the Paragraphs",
    description: "Order paragraphs into the correct sequence.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "paragraphs", type: "string[]", required: true, description: "Paragraph texts." },
      { name: "correctOrder", type: "number[]", required: true, description: "Correct index order." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence"],
    a11y: {
      element: "section",
      ariaLabel: "Sort the Paragraphs",
      keyboard: "Reorder with up/down buttons.",
      liveRegions: "aria-live order announcements.",
      notes: "H5P Sort the Paragraphs equivalent.",
    },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "GuessTheAnswer",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.GuessTheAnswer",
    h5pAlias: "Guess the Answer",
    description: "Reveal or score a hidden answer.",
    props: [
      { name: "checkId", type: "CheckId", required: false, description: "Required when scored (default)." },
      { name: "prompt", type: "string", required: true, description: "Prompt text." },
      { name: "answer", type: "string", required: true, description: "Hidden answer." },
      { name: "scored", type: "boolean", required: false, description: "Score learner guess (default true)." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: [],
    optionalIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence"],
    a11y: {
      element: "section",
      ariaLabel: "Guess the Answer",
      keyboard: "Text input and Check/Reveal controls.",
      notes: "H5P Guess the Answer equivalent.",
    },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id when scored." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "MultimediaChoice",
    category: "assessment" as const,
    assessmentContract: true as const,
    h5pMachineName: "H5P.ImageMultipleHotspotQuestion",
    h5pAlias: "Multimedia Choice",
    description: "Multiple choice with image or audio options.",
    props: [
      { name: "checkId", type: "CheckId", required: true, description: "Stable check id." },
      { name: "question", type: "string", required: true, description: "Question text." },
      { name: "choices", type: "MultimediaChoiceOption[]", required: true, description: "Media choices." },
      { name: "answer", type: "string", required: true, description: "Correct choice label." },
      ...assessmentBehaviourProps,
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson", "AssessmentSequence"],
    a11y: {
      element: "section",
      ariaLabel: "Multimedia Choice",
      keyboard: "Radio group with labeled media options.",
      notes: "Requires altText for every choice.",
    },
    theming: { surface: "global-inherit" as const, dataAttributes: ["data-lk-check-id"], stylingNotes: "Uses data-lk-check-id." },
    telemetry: { emits: ["assessment_answered", "assessment_completed"], requiresActiveLesson: true },
  },
  {
    type: "SingleChoiceSet",
    category: "container" as const,
    h5pMachineName: "H5P.SingleChoiceSet",
    h5pAlias: "Single Choice Set",
    description: "Sequential MCQ slides with aggregated scoring.",
    props: [
      { name: "blockId", type: "BlockId", required: false, description: "Stable block id." },
      { name: "title", type: "string", required: false, description: "Set title." },
      { name: "showSetScore", type: "boolean", required: false, description: "Show aggregated score." },
      { name: "children", type: "ReactNode", required: true, description: "Quiz or KnowledgeCheck steps." },
      ...assessmentBehaviourProps.filter((p) => p.name !== "passingScore"),
    ],
    requiredIds: [],
    optionalIds: ["blockId"],
    parentConstraints: ["Lesson"],
    a11y: {
      element: "section",
      ariaLabel: "Single choice set",
      keyboard: "Previous/Next between MCQ steps.",
      notes: "H5P Single Choice Set equivalent.",
    },
    theming: { surface: "global-inherit" as const, stylingNotes: "Container for Quiz steps." },
    telemetry: { emits: [], manualTracking: "Child Quiz blocks emit assessment_* events." },
  },
] satisfies BlockCatalogEntryV2[];

export const BLOCK_CATALOG_V2: BlockCatalogEntryV2[] = [
  ...(BLOCK_CATALOG as BlockCatalogEntryV2[]),
  ...v2AssessmentEntries,
];

export const BLOCK_CATALOG_V3: BlockCatalogEntryV3[] = buildV3CatalogFromV2(BLOCK_CATALOG_V2);

function cloneCatalogEntry<T extends BlockCatalogEntryV2>(entry: T): T {
  return {
    ...entry,
    props: entry.props.map((p) => ({ ...p })),
    aliases: entry.aliases ? [...entry.aliases] : undefined,
    optionalIds: entry.optionalIds ? [...entry.optionalIds] : undefined,
    parentConstraints: entry.parentConstraints ? [...entry.parentConstraints] : undefined,
    allowedChildTypes: entry.allowedChildTypes ? [...entry.allowedChildTypes] : undefined,
    a11y: { ...entry.a11y },
    theming: {
      ...entry.theming,
      dataAttributes: entry.theming.dataAttributes ? [...entry.theming.dataAttributes] : undefined,
    },
    telemetry: {
      ...entry.telemetry,
      emits: [...entry.telemetry.emits],
    },
  };
}

export type BuildBlockCatalogOptions = { version?: 1 | 2 | 3 };

export function buildBlockCatalog(
  opts?: BuildBlockCatalogOptions,
): BlockCatalogEntry[] | BlockCatalogEntryV2[] | BlockCatalogEntryV3[] {
  const version = opts?.version ?? 3;
  const source =
    version === 3 ? BLOCK_CATALOG_V3 : version === 2 ? BLOCK_CATALOG_V2 : BLOCK_CATALOG;
  return source.map((entry) => {
    const cloned = cloneCatalogEntry(entry);
    if (version !== 3) return cloned;
    const tier = tierForBlockType(entry.type);
    return tier ? { ...cloned, tier } : cloned;
  });
}

/** @deprecated Use buildBlockCatalog({ version: 1 }) */
export function buildBlockCatalogV1(): BlockCatalogEntry[] {
  return buildBlockCatalog({ version: 1 }) as BlockCatalogEntry[];
}

export function getBlockCatalogEntry(
  type: string,
  opts?: BuildBlockCatalogOptions,
): BlockCatalogEntry | BlockCatalogEntryV2 | BlockCatalogEntryV3 | undefined {
  const version = opts?.version ?? 3;
  const source =
    version === 3 ? BLOCK_CATALOG_V3 : version === 2 ? BLOCK_CATALOG_V2 : BLOCK_CATALOG;
  return source.find((entry) => entry.type === type || entry.aliases?.includes(type));
}

