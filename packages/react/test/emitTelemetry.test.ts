import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent, TelemetryEventName } from "@lessonkit/core";
import { createTrackingClient } from "@lessonkit/core";
import { createXAPIClient } from "@lessonkit/xapi";
import { buildTrackEvent, emitTelemetry } from "../src/runtime/emitTelemetry";

describe("emitTelemetry", () => {
  it("warns once in development when courseId is missing", () => {
    const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
    const prev = g.process?.env?.NODE_ENV;
    g.process = { env: { NODE_ENV: "development" } };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const tracking = createTrackingClient();
    const event = { name: "interaction", timestamp: "t", courseId: "" } as TelemetryEvent;

    emitTelemetry(tracking, null, event);
    emitTelemetry(tracking, null, event);

    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
    if (prev === undefined) {
      delete g.process;
    } else {
      g.process = { env: { NODE_ENV: prev } };
    }
  });

  it("tracks and sends xAPI when statement is returned", async () => {
    const sink = vi.fn();
    const tracking = createTrackingClient({ sink });
    const send = vi.fn();
    const xapi = { send, flush: async () => {}, queueSize: () => 0, startedLesson: () => {}, completeLesson: () => {}, completeCourse: () => {} };

    const event = buildTrackEvent({
      name: "course_started",
      courseId: "course-1",
      sessionId: "s1",
    });
    emitTelemetry(tracking, xapi, event);

    expect(sink).toHaveBeenCalled();
    expect(send).toHaveBeenCalled();
  });

  it("buildTrackEvent throws when lesson lifecycle events lack lessonId", () => {
    expect(() =>
      buildTrackEvent({ name: "lesson_started", courseId: "c", data: {} }),
    ).toThrow(/lessonId/);
  });

  it("buildTrackEvent supports interaction without lessonId", () => {
    const event = buildTrackEvent({
      name: "interaction",
      courseId: "c",
      data: { kind: "noop" },
    });
    expect(event.name).toBe("interaction");
  });

  it("buildTrackEvent default branch passes through unknown event names", () => {
    const event = buildTrackEvent({
      name: "future_event" as TelemetryEventName,
      courseId: "c",
    });
    expect(event.name).toBe("future_event");
    expect(event.courseId).toBe("c");
  });

  it("buildTrackEvent quiz events require active lessonId", () => {
    expect(() =>
      buildTrackEvent({
        name: "quiz_answered",
        courseId: "c",
        data: { checkId: "q1", question: "Q", choice: "A", correct: false },
      }),
    ).toThrow(/lessonId/);
  });
});
