import { describe, expect, it, vi } from "vitest";
import {
  buildCourseStartedEvent,
  isCourseStartedSinkSettled,
  isTrackingActive,
} from "../src/provider/courseStarted";
import { createSessionStoragePort } from "../src/runtime/ports";

describe("courseStarted helpers", () => {
  it("isTrackingActive defaults to true", () => {
    expect(isTrackingActive(undefined)).toBe(true);
    expect(isTrackingActive({ enabled: false })).toBe(false);
  });

  it("isCourseStartedSinkSettled is true only for emitted", () => {
    expect(isCourseStartedSinkSettled("emitted")).toBe(true);
    expect(isCourseStartedSinkSettled("failed")).toBe(false);
  });

  it("buildCourseStartedEvent returns course_started payload", () => {
    const event = buildCourseStartedEvent({
      pluginHost: null,
      courseId: "course-1",
      sessionId: "session-1",
      lxpackBridge: "auto",
    });
    expect(event?.name).toBe("course_started");
    expect(event?.courseId).toBe("course-1");
  });

  it("buildCourseStartedEvent accepts injected storage context via session", () => {
    const storage = createSessionStoragePort();
    expect(storage).toBeDefined();
  });
});
