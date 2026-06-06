/**
 * Test-only reset helpers. Prefer importing from `@lessonkit/react/testing` in test files.
 * Main-entry re-exports are deprecated and may be removed in LessonKit 2.0.
 */
export { resetQuizWarningsForTests } from "./components/Quiz";
export { resetAssessmentWarningsForTests } from "./assessment/AssessmentLessonGuard";
export { resetLessonMountRegistryForTests } from "./runtime/lessonMountRegistry";
export { resetCompoundValidationWarningsForTests } from "./compound/validateChildren";
export {
  resetLessonkitProviderStorageForTests,
  resetCourseStartedTrackingFlightForTests,
} from "./provider/useLessonkitProviderRuntime";
