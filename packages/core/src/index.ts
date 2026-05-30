export type {
  BlockId,
  CheckId,
  CourseId,
  LessonId,
  IdentityValidationIssue,
  IdentityValidationResult,
} from "./identityTypes";

export { ID_MAX_LENGTH, ID_PATTERN } from "./identityTypes";

export { validateId, assertValidId } from "./validateId";
export { slugifyId, deriveId } from "./slugify";
export { buildLessonkitUrn, type LessonkitUrnParts } from "./urn";

export type {
  InteractionData,
  LessonLifecycleData,
  QuizAnsweredData,
  QuizCompletedData,
  TelemetryBatchSink,
  TelemetryEvent,
  TelemetryEventBase,
  TelemetryEventName,
  TelemetrySink,
  TelemetryUser,
  TrackingClient,
} from "./telemetryTypes";

export {
  buildTelemetryCatalog,
  TELEMETRY_EVENT_CATALOG,
  telemetryCatalogVersion,
  type TelemetryCatalogEntry,
} from "./telemetryCatalog";

export { createTrackingClient } from "./trackingClient";
export { createSessionId } from "./ids";
export { nowIso } from "./time";

export type { BuildTelemetryEventInput } from "./telemetryBuilder";
export {
  buildTelemetryEvent,
  tryBuildTelemetryEvent,
  resetTelemetryBuilderWarningsForTests,
} from "./telemetryBuilder";

export type { EmitContext, TelemetryPipeline, TelemetryPipelineSink } from "./telemetryPipeline";
export { createTelemetryPipeline, createTrackingPipelineSink } from "./telemetryPipeline";

export type { StoragePort, ClockPort, TimerPort } from "./ports";
export {
  createDefaultClock,
  createGlobalTimer,
  createNoopStorage,
  createSessionStoragePort,
} from "./ports";

export type { ProgressState, ProgressController } from "./progress";
export { createProgressController } from "./progress";

export {
  SESSION_STORAGE_KEY,
  getTabSessionId,
  resolveSessionId,
  hasCourseStarted,
  markCourseStarted,
  migrateCourseStartedMark,
  hasCourseStartedEmittedToTracking,
  markCourseStartedEmittedToTracking,
} from "./session";

export type {
  CourseLifecycleContext,
  CourseLifecycleDeps,
  LessonCompletionEmitter,
} from "./runtime/courseLifecycle";
export {
  buildCourseStartedTelemetryEvent,
  completeCourseWithTelemetry,
  completeLessonWithTelemetry,
  tryEmitCourseStarted,
} from "./runtime/courseLifecycle";

export type {
  HeadlessLessonkitConfig,
  HeadlessLessonkitRuntime,
  HeadlessRuntimePorts,
  LessonkitRuntimeVersion,
} from "./runtime/createLessonkitRuntime";
export { createLessonkitRuntime } from "./runtime/createLessonkitRuntime";

export type {
  AssessmentPlugin,
  AssessmentScoreInput,
  AssessmentScoreResult,
  InteractionBlockRegistration,
  InteractionPlugin,
  LessonkitPlugin,
  LessonkitPluginContext,
  LessonkitPluginKind,
  LifecyclePlugin,
  PluginHost,
  PluginRegistry,
  TelemetryPlugin,
} from "./plugins";

export {
  createPluginRegistry,
  defineAssessmentPlugin,
  defineLifecyclePlugin,
  defineTelemetryPlugin,
} from "./plugins";
