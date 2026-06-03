export {
  Course,
  KnowledgeCheck,
  Lesson,
  ProgressTracker,
  Quiz,
  Reflection,
  Scenario,
  resetQuizWarningsForTests,
} from "./components";

export {
  TrueFalse,
  MarkTheWords,
  FillInTheBlanks,
  DragTheWords,
  DragAndDrop,
  AssessmentSequence,
} from "./blocks";

export type {
  CourseProps,
  KnowledgeCheckProps,
  LessonProps,
  ProgressTrackerProps,
  QuizProps,
  ReflectionProps,
  ScenarioProps,
} from "./components";

export type {
  TrueFalseProps,
  MarkTheWordsProps,
  FillInTheBlanksProps,
  FillInBlankSpec,
  DragTheWordsProps,
  DragAndDropProps,
  DragItem,
  DropTarget,
  AssessmentSequenceProps,
} from "./blocks";

export {
  useCompletion,
  useLessonkit,
  useProgress,
  useQuizState,
  useAssessmentState,
  useTracking,
} from "./hooks";

export { resetAssessmentWarningsForTests } from "./assessment/AssessmentLessonGuard";

export type { LessonkitConfig, LessonkitProviderProps, LessonkitRuntime } from "./context";
export { LessonkitProvider } from "./context";

export type {
  AssessmentAnsweredData,
  AssessmentBaseProps,
  AssessmentBehaviour,
  AssessmentCompletedData,
  AssessmentHandle,
  AssessmentInteractionType,
  AssessmentXAPIData,
  AssessmentScoreInput,
  AssessmentScoreResult,
  InteractionBlockRegistration,
  LessonkitPlugin,
  LessonkitPluginContext,
  LessonkitPluginKind,
  PluginHost,
  PluginRegistry,
  TelemetryPipelineSink,
} from "@lessonkit/core";
export {
  buildTelemetryEvent,
  createLessonkitRuntime,
  createPluginRegistry,
  createTelemetryPipeline,
  defineAssessmentPlugin,
  defineLifecyclePlugin,
  defineTelemetryPlugin,
} from "@lessonkit/core";

export type {
  ThemeContextValue,
  ThemeMode,
  ThemeProviderProps,
  ThemeResolvedMode,
} from "./theme/ThemeProvider";
export { ThemeProvider, useTheme } from "./theme/ThemeProvider";
export type { ThemePresetName } from "@lessonkit/themes";

export type { BlockCatalogEntry, BlockCatalogEntryV2, BlockPropSpec } from "./blockCatalog";
export {
  BLOCK_CATALOG,
  BLOCK_CATALOG_V2,
  blockCatalogVersion,
  blockCatalogV2Version,
  buildBlockCatalog,
  getBlockCatalogEntry,
} from "./blockCatalog";

