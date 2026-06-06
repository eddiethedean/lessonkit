import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import {
  resetCourseStartedTrackingFlightForTests,
  resetLessonkitProviderStorageForTests,
  resetLessonMountRegistryForTests,
  resetQuizWarningsForTests,
} from "../src/testing";

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
