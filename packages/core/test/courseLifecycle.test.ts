import { afterEach, describe, expect, it, vi } from "vitest";
import { createNoopStorage } from "../src/ports";
import { createProgressController } from "../src/progress";
import {
  buildCourseStartedTelemetryEvent,
  completeCourseWithTelemetry,
  completeLessonWithTelemetry,
  resetCourseStartedEmitFlightForTests,
  tryEmitCourseStarted,
} from "../src/runtime/courseLifecycle";

describe("courseLifecycle", () => {
  afterEach(() => {
    resetCourseStartedEmitFlightForTests();
  });
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

  it("tryEmitCourseStarted marks storage when emit succeeds", async () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
    };
    const ctx = {
      courseId: "c" as const,
      sessionId: "s",
      storage,
      pluginHost: null,
      lxpackBridge: "auto" as const,
    };
    const result = await tryEmitCourseStarted(ctx, { emitCourseStartedEvent: () => true }, false);
    expect(result.emitted).toBe(true);
    expect(result.marked).toBe(true);
  });

  it("tryEmitCourseStarted skips when already marked", async () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
    };
    const ctx = {
      courseId: "c" as const,
      sessionId: "s",
      storage,
      pluginHost: null,
      lxpackBridge: "auto" as const,
    };
    const emit = vi.fn(() => true);
    const first = await tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, false);
    const second = await tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, first.emitted);
    expect(second.emitted).toBe(true);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("tryEmitCourseStarted persists mark when alreadyEmittedToSink is true but storage is unmarked", async () => {
    const storage = createNoopStorage();
    const ctx = {
      courseId: "c" as const,
      sessionId: "s",
      storage,
      pluginHost: null,
      lxpackBridge: "auto" as const,
    };
    const result = await tryEmitCourseStarted(ctx, { emitCourseStartedEvent: () => true }, true);
    expect(result.emitted).toBe(true);
    expect(result.marked).toBe(true);
  });

  it("tryEmitCourseStarted reports marked false but dedupes when durable write fails", async () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (_k: string, _v: string) => false,
    };
    const ctx = {
      courseId: "c" as const,
      sessionId: "s",
      storage,
      pluginHost: null,
      lxpackBridge: "auto" as const,
    };
    const emit = vi.fn(() => true);
    const first = await tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, false);
    const second = await tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, false);
    expect(first.emitted).toBe(true);
    expect(first.marked).toBe(false);
    expect(second.emitted).toBe(true);
    expect(second.marked).toBe(true);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(memory.size).toBe(0);
  });

  it("tryEmitCourseStarted retries emit when storage is marked but sink has not received event", async () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
    };
    storage.setItem("lessonkit:course_started:s:c", "1");
    const ctx = {
      courseId: "c" as const,
      sessionId: "s",
      storage,
      pluginHost: null,
      lxpackBridge: "auto" as const,
    };
    const emit = vi.fn(() => true);
    const result = await tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, false);
    expect(result.emitted).toBe(true);
    expect(result.marked).toBe(true);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("tryEmitCourseStarted dedupes concurrent calls", async () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
        return true;
      },
    };
    const ctx = {
      courseId: "c" as const,
      sessionId: "s",
      storage,
      pluginHost: null,
      lxpackBridge: "auto" as const,
    };
    let emitCalls = 0;
    const emit = () => {
      emitCalls += 1;
      return true;
    };
    const [a, b] = await Promise.all([
      tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, false),
      tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, false),
    ]);
    expect(a).toEqual(b);
    expect(emitCalls).toBe(1);
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

  it("completeCourseWithTelemetry emits active lesson when course was already completed", () => {
    const progress = createProgressController();
    progress.setActiveLesson("l1", 0);
    progress.completeLesson("l1", 10);
    progress.completeCourse();
    progress.setActiveLesson("l2", 20);
    const events: string[] = [];
    const ok = completeCourseWithTelemetry({
      progress,
      nowMs: 50,
      emitLessonCompleted: (id, ms) => events.push(`lesson:${id}:${ms ?? ""}`),
      emitCourseCompleted: () => events.push("course"),
    });
    expect(ok).toBe(false);
    expect(events).toEqual(["lesson:l2:30"]);
  });
});
