import { describe, expect, it, vi, afterEach } from "vitest";
import type { BuildTelemetryEventInput } from "../src/telemetryBuilder";
import {
  buildTelemetryEvent,
  resetTelemetryBuilderWarningsForTests,
  tryBuildTelemetryEvent,
} from "../src/telemetryBuilder";

afterEach(() => {
  resetTelemetryBuilderWarningsForTests();
  vi.unstubAllEnvs();
});

describe("buildTelemetryEvent", () => {
  it("throws when lesson lifecycle events lack lessonId", () => {
    expect(() => buildTelemetryEvent({ name: "lesson_started", courseId: "c" })).toThrow(
      /lessonId/,
    );
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

  it("supports interaction without lessonId", () => {
    const event = buildTelemetryEvent({
      name: "interaction",
      courseId: "c",
      data: { kind: "noop" },
    });
    expect(event.name).toBe("interaction");
  });

  it("builds course lifecycle events", () => {
    expect(buildTelemetryEvent({ name: "course_started", courseId: "c" }).name).toBe("course_started");
    expect(buildTelemetryEvent({ name: "course_completed", courseId: "c" }).name).toBe("course_completed");
    expect(
      buildTelemetryEvent({
        name: "lesson_started",
        courseId: "c",
        lessonId: "l1",
      }).lessonId,
    ).toBe("l1");
    expect(
      buildTelemetryEvent({
        name: "quiz_completed",
        courseId: "c",
        lessonId: "l1",
        data: { checkId: "q1", score: 1 },
      }).name,
    ).toBe("quiz_completed");
  });

  it("lesson_started throws without lessonId", () => {
    expect(() => buildTelemetryEvent({ name: "lesson_started", courseId: "c" })).toThrow(/lessonId/);
  });

  it("default branch rejects unknown event names", () => {
    expect(() =>
      buildTelemetryEvent({
        name: "future_event",
        courseId: "c",
      } as unknown as BuildTelemetryEventInput),
    ).toThrow(/Unexpected value/);
  });

  it("builds quiz_answered with lessonId", () => {
    const event = buildTelemetryEvent({
      name: "quiz_answered",
      courseId: "c",
      lessonId: "l1",
      data: { checkId: "q1", question: "Q", choice: "A", correct: true },
    });
    expect(event.name).toBe("quiz_answered");
    expect(event.lessonId).toBe("l1");
  });

  it("quiz events require active lessonId", () => {
    expect(() =>
      buildTelemetryEvent({
        name: "quiz_answered",
        courseId: "c",
        data: { checkId: "q1", question: "Q", choice: "A", correct: false },
      }),
    ).toThrow(/lessonId/);
  });

  it("builds assessment_completed with interactionType", () => {
    const event = buildTelemetryEvent({
      name: "assessment_completed",
      courseId: "c",
      lessonId: "l1",
      data: { checkId: "tf-1", interactionType: "trueFalse", score: 1, maxScore: 1 },
    });
    expect(event.name).toBe("assessment_completed");
    expect(event.data).toBeDefined();
    if (event.name === "assessment_completed") {
      expect(event.data.interactionType).toBe("trueFalse");
    }
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

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/wrap <Quiz> in <Lesson>/));
    warn.mockRestore();
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
