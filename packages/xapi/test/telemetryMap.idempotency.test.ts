import { describe, expect, it } from "vitest";
import { telemetryEventToXAPIStatement } from "../src/telemetryMap";

describe("telemetryEventToXAPIStatement idempotency", () => {
  const baseEvent = {
    name: "course_started" as const,
    courseId: "my-course",
    timestamp: "2026-01-01T00:00:00.000Z",
    sessionId: "session-1",
  };

  it("maps the same event twice to identical statement ids", () => {
    const first = telemetryEventToXAPIStatement(baseEvent);
    const second = telemetryEventToXAPIStatement(baseEvent);
    expect(first?.id).toBeTruthy();
    expect(first?.id).toBe(second?.id);
  });

  it("uses telemetry event.id when it is a valid UUID", () => {
    const stableId = "550e8400-e29b-41d4-a716-446655440000";
    const statement = telemetryEventToXAPIStatement({ ...baseEvent, id: stableId });
    expect(statement?.id).toBe(stableId);
  });

  it("maps lifecycle events with different timestamps to identical statement ids", () => {
    const first = telemetryEventToXAPIStatement(baseEvent);
    const second = telemetryEventToXAPIStatement({
      ...baseEvent,
      timestamp: "2026-06-07T12:00:00.000Z",
    });
    expect(first?.id).toBeTruthy();
    expect(first?.id).toBe(second?.id);
  });

  it("maps assessment_completed with different timestamps to identical statement ids", () => {
    const base = {
      name: "assessment_completed" as const,
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: {
        checkId: "tf-1",
        interactionType: "trueFalse" as const,
        score: 1,
        maxScore: 1,
      },
    };
    const first = telemetryEventToXAPIStatement({
      ...base,
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    const second = telemetryEventToXAPIStatement({
      ...base,
      timestamp: "2026-06-07T12:00:00.000Z",
    });
    expect(first?.id).toBeTruthy();
    expect(first?.id).toBe(second?.id);
  });

  it("maps assessment_answered with same checkId but different answers to different ids", () => {
    const base = {
      name: "assessment_answered" as const,
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      timestamp: "2026-01-01T00:00:00.000Z",
      data: {
        checkId: "q1",
        interactionType: "trueFalse" as const,
        response: true,
        correct: true,
      },
    };
    const a = telemetryEventToXAPIStatement(base);
    const b = telemetryEventToXAPIStatement({
      ...base,
      timestamp: "2026-01-02T00:00:00.000Z",
      data: { ...base.data, response: false, correct: false },
    });
    expect(a?.id).toBeTruthy();
    expect(a?.id).not.toBe(b?.id);
  });
});
