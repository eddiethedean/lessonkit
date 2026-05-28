import { describe, expect, it, vi } from "vitest";
import { buildTrackEvent } from "../src/runtime/emitTelemetry";
import {
  forwardTelemetryToLxpack,
  setLxpackBridgeMode,
} from "../src/runtime/lxpackBridge";

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
        data: { checkId: "q1", score: 1, maxScore: 1 },
      }),
    );

    expect(completeCourse).toHaveBeenCalled();
    expect(submitAssessment).toHaveBeenCalledWith({
      id: "q1",
      score: 1,
      passingScore: 1,
    });
    vi.unstubAllGlobals();
  });

  it("does not forward when bridge mode is off", () => {
    setLxpackBridgeMode("off");
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
    );

    expect(completeLesson).not.toHaveBeenCalled();
    setLxpackBridgeMode("auto");
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
});
