export const blockCatalogVersion = 1 as const;

export type BlockPropSpec = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export type BlockCatalogEntry = {
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

export const BLOCK_CATALOG: BlockCatalogEntry[] = [
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
    ],
    requiredIds: ["checkId"],
    parentConstraints: ["Lesson"],
    a11y: {
      element: "section",
      ariaLabel: "Quiz",
      keyboard: "Radio group navigable with arrow keys; one choice per question.",
      liveRegions: "role='status' aria-live='polite' for Correct / Try again feedback.",
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
];

export function buildBlockCatalog(): BlockCatalogEntry[] {
  return BLOCK_CATALOG.map((entry) => ({
    ...entry,
    props: entry.props.map((p) => ({ ...p })),
    aliases: entry.aliases ? [...entry.aliases] : undefined,
    optionalIds: entry.optionalIds ? [...entry.optionalIds] : undefined,
    parentConstraints: entry.parentConstraints ? [...entry.parentConstraints] : undefined,
    a11y: { ...entry.a11y },
    theming: {
      ...entry.theming,
      dataAttributes: entry.theming.dataAttributes ? [...entry.theming.dataAttributes] : undefined,
    },
    telemetry: {
      ...entry.telemetry,
      emits: [...entry.telemetry.emits],
    },
  }));
}

export function getBlockCatalogEntry(type: string): BlockCatalogEntry | undefined {
  return BLOCK_CATALOG.find((entry) => entry.type === type || entry.aliases?.includes(type));
}
