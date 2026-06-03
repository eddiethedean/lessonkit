export {
  assertTrackingSinkConfig,
  buildCourseStartedEvent,
  emitCourseStarted,
  emitCourseStartedPipelineOnly,
  emitCourseStartedToTracking,
  emitCourseStartedToTrackingOnly,
  emitPendingCourseStarted,
  isCourseStartedSinkSettled,
  isTrackingActive,
  resetCourseStartedTrackingFlightForTests,
  type CourseStartedEmitOpts,
  type CourseStartedEmitResult,
} from "./emit";
