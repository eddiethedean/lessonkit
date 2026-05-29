import type { TelemetryEvent } from "@lessonkit/core";
import { describe, expect, it } from "vitest";
import { mapLessonkitTelemetryToBridgeAction } from "@lxpack/tracking-schema";
import { telemetryEventToLessonkit } from "../src/telemetry";

describe("telemetryEventToLessonkit", () => {
  it("maps quiz_completed checkId to assessmentId", () => {
    const event = {
      name: "quiz_completed",
      courseId: "c",
      lessonId: "l",
      sessionId: "s",
      timestamp: new Date().toISOString(),
      data: { checkId: "q1", score: 2, maxScore: 4, passingScore: 2 },
    } as TelemetryEvent;

    const mapped = telemetryEventToLessonkit(event);
    expect(mapped?.assessmentId).toBe("q1");
    expect(mapped?.score).toBe(2);

    const action = mapLessonkitTelemetryToBridgeAction(mapped!);
    expect(action?.kind).toBe("submitAssessment");
  });

  it("maps interaction and quiz_answered payloads", () => {
    const interaction = telemetryEventToLessonkit({
      name: "interaction",
      courseId: "c",
      lessonId: "l",
      sessionId: "s",
      timestamp: new Date().toISOString(),
      data: { type: "click" },
    } as TelemetryEvent);
    expect(interaction?.data).toEqual({ type: "click" });

    const answered = telemetryEventToLessonkit({
      name: "quiz_answered",
      courseId: "c",
      lessonId: "l",
      sessionId: "s",
      timestamp: new Date().toISOString(),
      data: { checkId: "q1", choice: "A", correct: true },
    } as TelemetryEvent);
    expect(answered?.assessmentId).toBe("q1");
    expect(answered?.data).toMatchObject({ choice: "A" });
  });

  it("returns null for unsupported events", () => {
    const event = {
      name: "lesson_time_on_task",
      courseId: "c",
      lessonId: "l",
      sessionId: "s",
      timestamp: new Date().toISOString(),
      data: { lessonId: "l" },
    } as TelemetryEvent;

    expect(telemetryEventToLessonkit(event)).toBeNull();
  });
});
