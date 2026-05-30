import { describe, expect, it, vi } from "vitest";
import { createNoopStorage } from "../src/ports";
import { createProgressController } from "../src/progress";
import {
  buildCourseStartedTelemetryEvent,
  completeCourseWithTelemetry,
  completeLessonWithTelemetry,
  tryEmitCourseStarted,
} from "../src/runtime/courseLifecycle";

describe("courseLifecycle", () => {
  it("buildCourseStartedTelemetryEvent includes session context", () => {
    const event = buildCourseStartedTelemetryEvent({
      courseId: "c",
      sessionId: "s",
      attemptId: "a",
      user: { id: "u1" },
      storage: createNoopStorage(),
      pluginHost: null,
      lxpackBridge: "auto",
    });
    expect(event.name).toBe("course_started");
    expect(event.courseId).toBe("c");
  });

  it("tryEmitCourseStarted marks storage when emit succeeds", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    };
    const ctx = {
      courseId: "c" as const,
      sessionId: "s",
      storage,
      pluginHost: null,
      lxpackBridge: "auto" as const,
    };
    const result = tryEmitCourseStarted(ctx, { emitCourseStartedEvent: () => true }, false);
    expect(result.emitted).toBe(true);
    expect(result.marked).toBe(true);
  });

  it("tryEmitCourseStarted skips when already marked", () => {
    const storage = createNoopStorage();
    const ctx = {
      courseId: "c" as const,
      sessionId: "s",
      storage,
      pluginHost: null,
      lxpackBridge: "auto" as const,
    };
    const emit = vi.fn(() => true);
    const first = tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, false);
    const second = tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, first.emitted);
    expect(second.emitted).toBe(true);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("completeLessonWithTelemetry emits when progress completes", () => {
    const progress = createProgressController();
    progress.setActiveLesson("l1", 0);
    const emitted: string[] = [];
    const ok = completeLessonWithTelemetry({
      progress,
      lessonId: "l1",
      nowMs: 100,
      emitLessonCompleted: (id, ms) => emitted.push(`${id}:${ms}`),
    });
    expect(ok).toBe(true);
    expect(emitted).toEqual(["l1:100"]);
  });

  it("completeCourseWithTelemetry completes active lesson then course", () => {
    const progress = createProgressController();
    progress.setActiveLesson("l1", 0);
    const events: string[] = [];
    const ok = completeCourseWithTelemetry({
      progress,
      nowMs: 50,
      emitLessonCompleted: (id) => events.push(`lesson:${id}`),
      emitCourseCompleted: () => events.push("course"),
    });
    expect(ok).toBe(true);
    expect(events).toEqual(["lesson:l1", "course"]);
  });
});
