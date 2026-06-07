import type { TelemetryEvent } from "@lessonkit/core";
import { describe, expect, it } from "vitest";
import { mapLessonkitTelemetryToBridgeAction } from "@lxpack/tracking-schema";
import { answeredTelemetryToBridgeTrackEvent, telemetryEventToLessonkit } from "../src/telemetry";

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

  it("maps assessment_answered checkId to assessmentId and bridge track", () => {
    const event = {
      name: "assessment_answered",
      courseId: "c",
      lessonId: "l",
      sessionId: "s",
      timestamp: new Date().toISOString(),
      data: {
        checkId: "tf-1",
        interactionType: "trueFalse",
        response: true,
        correct: true,
      },
    } as TelemetryEvent;

    const mapped = telemetryEventToLessonkit(event);
    expect(mapped?.assessmentId).toBe("tf-1");
    expect(mapped?.data).toMatchObject({ interactionType: "trueFalse", correct: true });

    const action = mapLessonkitTelemetryToBridgeAction({
      ...mapped!,
      name: "quiz_answered",
    });
    expect(action).toBeNull();

    const track = answeredTelemetryToBridgeTrackEvent(event);
    expect(track).toMatchObject({
      type: "assessment",
      id: "tf-1",
    });
  });

  it("maps branch telemetry events with data payloads", () => {
    const viewed = telemetryEventToLessonkit({
      name: "branch_node_viewed",
      courseId: "c",
      lessonId: "l",
      sessionId: "s",
      timestamp: new Date().toISOString(),
      data: { blockId: "bs-1", nodeId: "offer", nodeIndex: 0 },
    } as TelemetryEvent);
    expect(viewed?.data).toMatchObject({ blockId: "bs-1", nodeId: "offer" });

    const selected = telemetryEventToLessonkit({
      name: "branch_selected",
      courseId: "c",
      lessonId: "l",
      sessionId: "s",
      timestamp: new Date().toISOString(),
      data: {
        blockId: "bs-1",
        fromNodeId: "offer",
        toNodeId: "credit",
        label: "Credit",
        scoreWeight: 1,
      },
    } as TelemetryEvent);
    expect(selected?.data).toMatchObject({ toNodeId: "credit" });
  });
});
