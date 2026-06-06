/**
 * Test-only reset helpers. Prefer importing from `@lessonkit/core/testing` in test files.
 * Main-entry re-exports are deprecated and may be removed in LessonKit 2.0.
 */
export { resetTelemetryBuilderWarningsForTests } from "./telemetryBuilder";
export { resetStoragePortForTests } from "./ports";
export { resetSharedVolatileSessionIdForTests } from "./session";
export { resetCourseStartedEmitFlightForTests } from "./runtime/courseLifecycle";
