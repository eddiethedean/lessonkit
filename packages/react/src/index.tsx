export {
  Course,
  KnowledgeCheck,
  Lesson,
  ProgressTracker,
  Quiz,
  Reflection,
  Scenario,
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
} from "@lessonkit/core";
export { createPluginHost, defineLessonkitPlugin } from "@lessonkit/core";

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

