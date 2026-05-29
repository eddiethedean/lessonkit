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
