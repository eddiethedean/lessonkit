import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { TelemetryEvent, TrackingClient } from "@lessonkit/core";
import { emitCourseStartedToTracking, resetCourseStartedTrackingFlightForTests } from "../src/provider/courseStarted/emit";
import { createSessionStoragePort } from "../src/runtime/ports";
import { hasCourseStartedEmittedToTracking } from "../src/runtime/session";

describe("emitCourseStartedToTracking", () => {
  const event: TelemetryEvent = {
    name: "course_started",
    timestamp: "2026-01-01T00:00:00Z",
    courseId: "course-1",
  };

  beforeEach(() => {
    sessionStorage.clear();
    resetCourseStartedTrackingFlightForTests();
  });

  afterEach(() => {
    resetCourseStartedTrackingFlightForTests();
  });

  it("marks dedupe only after successful flush", async () => {
    const storage = createSessionStoragePort();
    const tracking: TrackingClient = {
      track: vi.fn(),
      flush: vi.fn(async () => false),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
    );

    expect(ok).toBe(false);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(false);
  });

  it("marks dedupe after flush succeeds", async () => {
    const storage = createSessionStoragePort();
    const tracking: TrackingClient = {
      track: vi.fn(),
      flush: vi.fn(async () => true),
    };

    const ok = await emitCourseStartedToTracking(
      tracking,
      storage,
      "session-1",
      "course-1",
      event,
    );

    expect(ok).toBe(true);
    expect(hasCourseStartedEmittedToTracking(storage, "session-1", "course-1")).toBe(true);
  });
});
