import { describe, expect, it } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import { createXAPIClient, telemetryEventToXAPIStatement } from "../src";

const base = {
  courseId: "cyber-basics",
  lessonId: "phishing-101",
  sessionId: "sess-1",
  timestamp: "2026-05-28T12:00:00.000Z",
} as const;

describe("telemetryEventToXAPIStatement", () => {
  it("maps course and lesson lifecycle events", () => {
    expect(
      telemetryEventToXAPIStatement({
        name: "course_started",
        courseId: base.courseId,
        timestamp: base.timestamp,
      })?.object.id,
    ).toBe("urn:lessonkit:course:cyber-basics");

    expect(
      telemetryEventToXAPIStatement({
        name: "course_completed",
        courseId: base.courseId,
        timestamp: base.timestamp,
      })?.verb,
    ).toBe("http://adlnet.gov/expapi/verbs/completed");

    expect(
      telemetryEventToXAPIStatement({
        name: "lesson_started",
        ...base,
        data: { lessonId: base.lessonId },
      })?.object.id,
    ).toBe("urn:lessonkit:course:cyber-basics:lesson:phishing-101");
  });

  it("maps quiz events to check URNs", () => {
    const answered: TelemetryEvent = {
      name: "quiz_answered",
      ...base,
      data: {
        checkId: "verify-sender",
        question: "Q",
        choice: "A",
        correct: true,
      },
    };
    expect(telemetryEventToXAPIStatement(answered)?.verb).toBe(
      "http://adlnet.gov/expapi/verbs/answered",
    );
    expect(telemetryEventToXAPIStatement(answered)?.object.id).toBe(
      "urn:lessonkit:course:cyber-basics:lesson:phishing-101:check:verify-sender",
    );
    expect(telemetryEventToXAPIStatement(answered)?.result?.success).toBe(true);

    const unanswered = {
      name: "quiz_answered",
      courseId: base.courseId,
      lessonId: base.lessonId,
      sessionId: base.sessionId,
      timestamp: base.timestamp,
      data: { checkId: "verify-sender", question: "Q", choice: "A" },
    } as TelemetryEvent;
    expect(telemetryEventToXAPIStatement(unanswered)?.result).toBeUndefined();
  });

  it("returns null for lesson_time_on_task", () => {
    expect(
      telemetryEventToXAPIStatement({
        name: "lesson_time_on_task",
        ...base,
        data: { lessonId: base.lessonId, durationMs: 100 },
      }),
    ).toBeNull();
  });

  it("maps lesson_completed with duration and score", () => {
    const stmt = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId, durationMs: 1500, score: 1, maxScore: 2, success: true },
    });
    expect(stmt?.result?.duration).toBe("PT1.5S");
    expect(stmt?.result?.success).toBe(true);
    expect(stmt?.result?.score).toMatchObject({ raw: 1, max: 2 });
  });

  it("maps lesson_completed partial result fields", () => {
    const scoreOnly = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId, score: 3 },
    });
    expect(scoreOnly?.result?.score).toMatchObject({ raw: 3, max: undefined, scaled: undefined });

    const maxOnly = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId, maxScore: 10 },
    });
    expect(maxOnly?.result?.score).toMatchObject({ raw: undefined, max: 10, scaled: undefined });

    const zeroMax = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId, score: 1, maxScore: 0 },
    });
    expect(zeroMax?.result?.score?.scaled).toBeUndefined();

    const bare = telemetryEventToXAPIStatement({
      name: "lesson_completed",
      ...base,
      data: { lessonId: base.lessonId },
    });
    expect(bare?.result).toBeUndefined();
  });

  it("maps quiz_completed with score", () => {
    const stmt = telemetryEventToXAPIStatement({
      name: "quiz_completed",
      ...base,
      data: { checkId: "c1", score: 1, maxScore: 1 },
    });
    expect(stmt?.object.id).toContain(":check:c1");
    expect(stmt?.result?.score).toMatchObject({ raw: 1, max: 1, scaled: 1 });

    const scoreOnly = telemetryEventToXAPIStatement({
      name: "quiz_completed",
      ...base,
      data: { checkId: "c1", score: 2 },
    });
    expect(scoreOnly?.result?.score).toMatchObject({ raw: 2, max: undefined, scaled: undefined });

    const maxOnly = telemetryEventToXAPIStatement({
      name: "quiz_completed",
      ...base,
      data: { checkId: "c1", maxScore: 4 },
    });
    expect(maxOnly?.result?.score).toMatchObject({ raw: undefined, max: 4, scaled: undefined });

    const bare = telemetryEventToXAPIStatement({
      name: "quiz_completed",
      ...base,
      data: { checkId: "c1" },
    });
    expect(bare?.result).toBeUndefined();
  });

  it("maps interaction with blockId and returns null without blockId", () => {
    expect(
      telemetryEventToXAPIStatement({
        name: "interaction",
        courseId: base.courseId,
        timestamp: base.timestamp,
        lessonId: base.lessonId,
        data: { kind: "click" },
      }),
    ).toBeNull();

    expect(
      telemetryEventToXAPIStatement({
        name: "interaction",
        courseId: base.courseId,
        timestamp: base.timestamp,
        data: { kind: "click", blockId: "intro" },
      }),
    ).toBeNull();

    expect(
      telemetryEventToXAPIStatement({
        name: "interaction",
        ...base,
        data: { kind: "click", blockId: "intro" },
      })?.object.id,
    ).toBe("urn:lessonkit:course:cyber-basics:lesson:phishing-101:block:intro");
  });

  it("throws for unknown event names", () => {
    expect(() =>
      telemetryEventToXAPIStatement({
        name: "unknown" as "course_started",
        courseId: base.courseId,
        timestamp: base.timestamp,
      }),
    ).toThrow(/Unhandled telemetry event/);
  });

  it("createXAPIClient uses mapper URNs", async () => {
    const statements: { object: { id: string } }[] = [];
    const client = createXAPIClient({
      courseId: "my-course",
      transport: async (s) => {
        statements.push(s);
      },
    });
    client.completeCourse();
    client.startedLesson({ lessonId: "lesson-1" });
    await Promise.resolve();
    expect(statements[0]?.object.id).toBe("urn:lessonkit:course:my-course");
    expect(statements[1]?.object.id).toBe("urn:lessonkit:course:my-course:lesson:lesson-1");
  });
});
