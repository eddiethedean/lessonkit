import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import { createTrackingClient } from "@lessonkit/core";
import { buildTelemetryEvent, emitTelemetry, tryBuildTelemetryEvent } from "../src/runtime/emitTelemetry";

describe("emitTelemetry", () => {
  it("warns once in development when courseId is missing", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const tracking = createTrackingClient();
    const event = { name: "interaction", timestamp: "t", courseId: "" } as TelemetryEvent;

    emitTelemetry(tracking, null, event);
    emitTelemetry(tracking, null, event);

    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  it("tracks and sends xAPI when statement is returned", async () => {
    const sink = vi.fn();
    const tracking = createTrackingClient({ sink });
    const send = vi.fn();
    const xapi = { send, flush: async () => {}, queueSize: () => 0, startedLesson: () => {}, completeLesson: () => {}, completeCourse: () => {} };

    const event = buildTelemetryEvent({
      name: "course_started",
      courseId: "course-1",
      sessionId: "s1",
    });
    await emitTelemetry(tracking, xapi, event);

    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({ name: "course_started", courseId: "course-1", sessionId: "s1" }),
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        verb: expect.stringContaining("initialized"),
        object: expect.objectContaining({ id: expect.stringContaining("course-1") }),
      }),
    );
  });

  it("buildTelemetryEvent throws when lesson lifecycle events lack lessonId", () => {
    expect(() =>
      buildTelemetryEvent({ name: "lesson_started", courseId: "c" }),
    ).toThrow(/lessonId/);
  });

  it("lesson_completed uses opts.lessonId when data.lessonId conflicts", () => {
    const event = buildTelemetryEvent({
      name: "lesson_completed",
      courseId: "c",
      lessonId: "canonical",
      data: { lessonId: "wrong", durationMs: 5 },
    });
    expect(event.lessonId).toBe("canonical");
    if (event.name === "lesson_completed") {
      expect(event.data.lessonId).toBe("canonical");
      expect(event.data.durationMs).toBe(5);
    }
  });

  it("buildTelemetryEvent supports interaction without lessonId", () => {
    const event = buildTelemetryEvent({
      name: "interaction",
      courseId: "c",
      data: { kind: "noop" },
    });
    expect(event.name).toBe("interaction");
  });

  it("buildTelemetryEvent default branch rejects unknown event names", () => {
    expect(() =>
      buildTelemetryEvent({
        name: "future_event",
        courseId: "c",
      } as unknown as import("@lessonkit/core").BuildTelemetryEventInput),
    ).toThrow(/Unexpected value/);
  });

  it("forwards lesson_completed to lxpackBridge when embedded", async () => {
    const completeLesson = vi.fn();
    const parent = {
      lxpackBridge: { v1: { completeLesson } },
    };
    vi.stubGlobal("window", { parent } as unknown as Window);

    const tracking = createTrackingClient();
    const event = buildTelemetryEvent({
      name: "lesson_completed",
      courseId: "c",
      lessonId: "lesson-1",
      sessionId: "s1",
      data: { lessonId: "lesson-1" },
    });
    await emitTelemetry(tracking, null, event);

    expect(completeLesson).toHaveBeenCalledWith("lesson-1");
    vi.unstubAllGlobals();
  });

  it("buildTelemetryEvent quiz events require active lessonId", () => {
    expect(() =>
      buildTelemetryEvent({
        name: "quiz_answered",
        courseId: "c",
        data: { checkId: "q1", question: "Q", choice: "A", correct: false },
      }),
    ).toThrow(/lessonId/);
  });
});

describe("tryBuildTelemetryEvent", () => {
  it("returns null and warns in dev when quiz events lack lessonId", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      tryBuildTelemetryEvent({
        name: "quiz_answered",
        courseId: "c",
        data: { checkId: "q1", question: "Q", choice: "A", correct: false },
      }),
    ).toBeNull();

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/wrap <Quiz> in <Lesson>/),
    );
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  it("returns null silently in production when quiz events lack lessonId", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      tryBuildTelemetryEvent({
        name: "quiz_completed",
        courseId: "c",
        data: { checkId: "q1" },
      }),
    ).toBeNull();

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  it("returns null when lesson-scoped events lack lessonId", () => {
    expect(
      tryBuildTelemetryEvent({ name: "lesson_started", courseId: "c" }),
    ).toBeNull();
  });

  it("returns built events for valid quiz payloads", () => {
    const event = tryBuildTelemetryEvent({
      name: "quiz_completed",
      courseId: "c",
      lessonId: "lesson-1",
      data: { checkId: "q1", score: 1 },
    });
    expect(event?.name).toBe("quiz_completed");
  });
});
