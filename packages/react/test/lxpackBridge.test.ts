import { describe, expect, it, vi } from "vitest";
import { buildTrackEvent, emitTelemetry } from "../src/runtime/emitTelemetry";
import { forwardTelemetryToLxpack } from "../src/runtime/lxpackBridge";
import { createTrackingClient } from "@lessonkit/core";

describe("lxpackBridge", () => {
  it("forwards course_completed and quiz_completed", () => {
    const completeCourse = vi.fn();
    const submitAssessment = vi.fn();
    vi.stubGlobal("window", {
      parent: { lxpackBridge: { v1: { completeCourse, submitAssessment } } },
    } as unknown as Window);

    forwardTelemetryToLxpack(
      buildTrackEvent({ name: "course_completed", courseId: "c", sessionId: "s" }),
    );
    forwardTelemetryToLxpack(
      buildTrackEvent({
        name: "quiz_completed",
        courseId: "c",
        lessonId: "l",
        sessionId: "s",
        data: { checkId: "q1", score: 1, maxScore: 1, passingScore: 0.8 },
      }),
    );

    expect(completeCourse).toHaveBeenCalled();
    expect(submitAssessment).toHaveBeenCalledWith({
      id: "q1",
      score: 1,
      passingScore: 0.8,
    });
    vi.unstubAllGlobals();
  });

  it("does not forward when bridge mode is off", () => {
    const completeLesson = vi.fn();
    vi.stubGlobal("window", {
      parent: { lxpackBridge: { v1: { completeLesson } } },
    } as unknown as Window);

    forwardTelemetryToLxpack(
      buildTrackEvent({
        name: "lesson_completed",
        courseId: "c",
        lessonId: "l",
        sessionId: "s",
        data: { lessonId: "l" },
      }),
      "off",
    );

    expect(completeLesson).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("uses legacy parent.lxpack and ignores quiz without checkId", () => {
    const completeLesson = vi.fn();
    const submitAssessment = vi.fn();
    vi.stubGlobal("window", {
      parent: { lxpack: { completeLesson, submitAssessment } },
    } as unknown as Window);

    forwardTelemetryToLxpack(
      buildTrackEvent({
        name: "quiz_completed",
        courseId: "c",
        lessonId: "l",
        sessionId: "s",
        data: {},
      }),
    );
    forwardTelemetryToLxpack(
      buildTrackEvent({ name: "course_started", courseId: "c", sessionId: "s" }),
    );

    expect(submitAssessment).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("emitTelemetry respects per-call lxpack bridge mode", () => {
    const completeCourse = vi.fn();
    vi.stubGlobal("window", {
      parent: { lxpackBridge: { v1: { completeCourse } } },
    } as unknown as Window);

    const tracking = createTrackingClient();
    const event = buildTrackEvent({ name: "course_completed", courseId: "c", sessionId: "s" });

    emitTelemetry(tracking, null, event, { lxpackBridge: "off" });
    expect(completeCourse).not.toHaveBeenCalled();

    emitTelemetry(tracking, null, event, { lxpackBridge: "auto" });
    expect(completeCourse).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
