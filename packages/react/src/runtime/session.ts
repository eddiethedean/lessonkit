export {
  SESSION_STORAGE_KEY,
  getTabSessionId,
  resolveSessionId,
  hasCourseStarted,
  markCourseStarted,
  hasCourseStartedEmittedToTracking,
  markCourseStartedEmittedToTracking,
  hasCourseStartedPipelineDelivered,
  markCourseStartedPipelineDelivered,
  hasCourseStartedXapiSent,
  markCourseStartedXapiSent,
  migrateCourseStartedMark,
} from "@lessonkit/core";
