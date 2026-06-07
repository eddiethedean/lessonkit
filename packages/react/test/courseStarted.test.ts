import { describe, expect, it } from "vitest";
import {
  buildCourseStartedEvent,
  isCourseStartedSinkSettled,
  isTrackingActive,
} from "../src/provider/courseStarted";

describe("courseStarted helpers", () => {
  it("isTrackingActive defaults to true", () => {
    expect(isTrackingActive(undefined)).toBe(true);
    expect(isTrackingActive({ enabled: false })).toBe(false);
  });

  it("isCourseStartedSinkSettled is true only for emitted", () => {
    expect(isCourseStartedSinkSettled("emitted")).toBe(true);
    expect(isCourseStartedSinkSettled("filtered")).toBe(false);
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

  it("buildCourseStartedEvent includes session metadata when provided", () => {
    const event = buildCourseStartedEvent({
      pluginHost: null,
      courseId: "course-1",
      sessionId: "session-42",
      lxpackBridge: "auto",
    });
    expect(event?.sessionId).toBe("session-42");
    expect(event?.name).toBe("course_started");
    expect(event?.courseId).toBe("course-1");
  });

  it("buildCourseStartedEvent assigns a stable dedupe id", () => {
    const event = buildCourseStartedEvent({
      pluginHost: null,
      courseId: "course-1",
      sessionId: "session-42",
      lxpackBridge: "auto",
    });
    expect(event?.id).toBe("session-42:course-1:course_started");
  });
});
