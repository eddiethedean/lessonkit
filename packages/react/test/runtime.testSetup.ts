import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { resetQuizWarningsForTests } from "../src";
import { resetLessonMountRegistryForTests } from "../src/runtime/lessonMountRegistry";
import {
  resetCourseStartedTrackingFlightForTests,
  resetLessonkitProviderStorageForTests,
} from "../src/provider/useLessonkitProviderRuntime";

export function registerRuntimeTestCleanup(): void {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    resetQuizWarningsForTests();
    resetLessonMountRegistryForTests();
    resetLessonkitProviderStorageForTests();
    resetCourseStartedTrackingFlightForTests();
  });
}
