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
  useCompletion,
  useLessonkit,
  useProgress,
  useQuizState,
  useTracking,
} from "./hooks";

export type { LessonkitConfig, LessonkitRuntime } from "./context";
export { LessonkitProvider } from "./context";

export type {
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

export type { BlockCatalogEntry, BlockPropSpec } from "./blockCatalog";
export {
  BLOCK_CATALOG,
  blockCatalogVersion,
  buildBlockCatalog,
  getBlockCatalogEntry,
} from "./blockCatalog";

