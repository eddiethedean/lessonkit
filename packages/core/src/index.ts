export type {
  BlockId,
  CheckId,
  CourseId,
  LessonId,
  LessonkitUrn,
  IdentityIdPath,
  IdentityValidationIssue,
  IdentityValidationResult,
} from "./identityTypes";

export { ID_MAX_LENGTH, ID_PATTERN } from "./identityTypes";

export { assertNever } from "./assertNever";

export {
  validateId,
  assertValidId,
  parseCourseId,
  parseLessonId,
  parseCheckId,
  parseBlockId,
} from "./validateId";
export { slugifyId, deriveId } from "./slugify";
export { buildLessonkitUrn, type LessonkitUrnParts } from "./urn";

export type {
  AssessmentAnsweredData,
  AssessmentCompletedData,
  InteractionData,
  LessonLifecycleData,
  QuizAnsweredData,
  QuizCompletedData,
  BookPageViewedData,
  SlideViewedData,
  CompoundPageViewedData,
  HotspotOpenedData,
  AccordionSectionToggledData,
  FlashcardFlippedData,
  ImageSliderChangedData,
  VideoCueReachedData,
  VideoSegmentCompletedData,
  MemoryCardFlippedData,
  InformationWallSearchData,
  ParallaxSlideViewedData,
  QuestionnaireSubmittedData,
  BranchNodeViewedData,
  BranchSelectedData,
  TelemetryBatchSink,
  TelemetryEvent,
  TelemetryEventBase,
  TelemetryEventName,
  TelemetrySink,
  TelemetryUser,
  TelemetryDataFor,
  TrackingClient,
} from "./telemetryTypes";

export type {
  AssessmentBehaviour,
  AssessmentHandle,
  AssessmentInteractionType,
  AssessmentXAPIData,
  AssessmentBaseProps,
  AssessmentResumeState,
  McqAssessmentProps,
} from "./assessment";

export type { LmsBridgeMode } from "./bridgeTypes";

export type {
  CompoundHandle,
  CompoundBaseProps,
  CompoundResumeState,
  CompoundResumeInput,
} from "./compound";
export {
  COMPOUND_RESUME_SCHEMA_VERSION,
  clampCompoundPageIndex,
  createCompoundResumeState,
  parseCompoundResumeState,
} from "./compound";

export {
  compoundStateStorageKey,
  loadCompoundState,
  saveCompoundState,
  clearCompoundState,
} from "./compoundState";

export {
  PAGE_ALLOWED_CHILD_TYPES,
  INTERACTIVE_BOOK_ALLOWED_CHILD_TYPES,
  SLIDE_ALLOWED_CHILD_TYPES,
  SLIDE_DECK_ALLOWED_CHILD_TYPES,
  TIMED_CUE_ALLOWED_CHILD_TYPES,
  INTERACTIVE_VIDEO_ALLOWED_CHILD_TYPES,
  ASSESSMENT_SEQUENCE_ALLOWED_CHILD_TYPES,
  BRANCHING_SCENARIO_ALLOWED_CHILD_TYPES,
  BRANCH_NODE_ALLOWED_CHILD_TYPES,
  COMPOUND_MAX_NESTING_DEPTH,
  ACCORDION_FORBIDDEN_CHILD_TYPES,
  BLOCKS_14_PAGE_SLIDE,
  getAllowedChildTypes,
  isChildTypeAllowed,
  type CompoundParentType,
} from "./compoundAllowlists";

export {
  validateBranchGraph,
  type BranchGraphNodeInput,
  type BranchGraphValidationIssue,
  type BranchGraphValidationResult,
} from "./branchGraph";

export {
  buildTelemetryCatalog,
  TELEMETRY_EVENT_CATALOG,
  telemetryCatalogVersion,
  type TelemetryCatalogEntry,
} from "./telemetryCatalog";

export {
  buildTelemetryCatalogV2,
  TELEMETRY_EVENT_CATALOG_V2,
  telemetryCatalogV2Version,
  type TelemetryCatalogV2Entry,
} from "./telemetryCatalogV2";

export {
  buildTelemetryCatalogV3,
  TELEMETRY_EVENT_CATALOG_V3,
  telemetryCatalogV3Version,
  type TelemetryCatalogV3Entry,
} from "./telemetryCatalogV3";

export { createTrackingClient } from "./trackingClient";
export { createSessionId } from "./ids";
export { nowIso } from "./time";

export type { BuildTelemetryEventInput } from "./telemetryBuilder";
export {
  buildTelemetryEvent,
  tryBuildTelemetryEvent,
  /** @deprecated Import from `@lessonkit/core/testing`. */
  resetTelemetryBuilderWarningsForTests,
} from "./telemetryBuilder";

export type { EmitContext, TelemetryPipeline, TelemetryPipelineSink } from "./telemetryPipeline";
export {
  createTelemetryPipeline,
  createTrackingPipelineSink,
  isLifecycleTelemetryEvent,
} from "./telemetryPipeline";

export type { StoragePort, ClockPort, TimerPort } from "./ports";
export {
  createDefaultClock,
  createGlobalTimer,
  createNoopStorage,
  createSessionStoragePort,
  /** @deprecated Import from `@lessonkit/core/testing`. */
  resetStoragePortForTests,
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
  hasCourseStartedPipelineDelivered,
  markCourseStartedPipelineDelivered,
  hasCourseStartedXapiSent,
  markCourseStartedXapiSent,
  /** @deprecated Import from `@lessonkit/core/testing`. */
  resetSharedVolatileSessionIdForTests,
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
  TelemetryEmitFn,
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
  PluginIdentity,
  PluginRegistry,
  TelemetryPlugin,
} from "./plugins";

export { buildPluginContext } from "./plugins/context";
export {
  createPluginRegistry,
  defineAssessmentPlugin,
  defineLifecyclePlugin,
  defineTelemetryPlugin,
} from "./plugins";
