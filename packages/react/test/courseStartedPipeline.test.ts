import { describe, expect, it, vi, afterEach } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import * as xapiModule from "@lessonkit/xapi";
import { emitCourseStartedNonTrackingPipeline } from "../src/runtime/courseStartedPipeline";

const courseStartedEvent: TelemetryEvent = {
  name: "course_started",
  timestamp: "2020-01-01T00:00:00Z",
  courseId: "course-1",
  sessionId: "session-1",
};

function mockXapiClient(send = vi.fn()): XAPIClient {
  return {
    send,
    flush: async () => {},
    queueSize: () => 0,
    startedLesson: () => {},
    completeLesson: () => {},
    completeCourse: () => {},
  };
}

describe("emitCourseStartedNonTrackingPipeline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends xAPI and reports xapiStatementSent", () => {
    const send = vi.fn();
    const result = emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: mockXapiClient(send),
      lxpackBridge: "off",
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(result.xapiStatementSent).toBe(true);
  });

  it("skips xAPI when skipXapi is true", () => {
    const send = vi.fn();
    const result = emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: mockXapiClient(send),
      lxpackBridge: "off",
      skipXapi: true,
    });
    expect(send).not.toHaveBeenCalled();
    expect(result.xapiStatementSent).toBe(false);
  });

  it("skips xAPI when client is null", () => {
    const result = emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: null,
      lxpackBridge: "off",
    });
    expect(result.xapiStatementSent).toBe(false);
  });

  it("does not send when mapping returns no statement", () => {
    const send = vi.fn();
    vi.spyOn(xapiModule, "telemetryEventToXAPIStatement").mockReturnValue(null);
    const result = emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: mockXapiClient(send),
      lxpackBridge: "off",
    });
    expect(send).not.toHaveBeenCalled();
    expect(result.xapiStatementSent).toBe(false);
  });

  it("forwards to extraSinks", () => {
    const extra: TelemetryEvent[] = [];
    emitCourseStartedNonTrackingPipeline({
      event: courseStartedEvent,
      xapi: null,
      lxpackBridge: "off",
      extraSinks: [{ id: "extra", emit: (e) => void extra.push(e) }],
    });
    expect(extra).toHaveLength(1);
    expect(extra[0]?.name).toBe("course_started");
  });
});
