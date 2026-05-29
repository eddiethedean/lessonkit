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

export type {
  AssessmentScoreInput,
  AssessmentScoreResult,
  InteractionBlockRegistration,
  LessonkitPlugin,
  LessonkitPluginContext,
  LessonkitPluginKind,
  PluginHost,
} from "./plugins";

export { createPluginHost, defineLessonkitPlugin } from "./plugins";
