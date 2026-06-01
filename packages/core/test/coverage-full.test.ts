import { describe, expect, it, vi, afterEach } from "vitest";
import type { TelemetryEvent } from "../src";
import {
  createPluginRegistry,
  createProgressController,
  createTrackingClient,
  createTelemetryPipeline,
  defineTelemetryPlugin,
  deriveId,
  slugifyId,
} from "../src";
import { createNoopStorage } from "../src/ports";
import {
  buildTelemetryEvent,
  resetTelemetryBuilderWarningsForTests,
  tryBuildTelemetryEvent,
} from "../src/telemetryBuilder";
import {
  hasCourseStartedPipelineDelivered,
  markCourseStartedEmittedToTracking,
  markCourseStartedPipelineDelivered,
  migrateCourseStartedMark,
} from "../src/session";
import {
  completeCourseWithTelemetry,
  completeLessonWithTelemetry,
  tryEmitCourseStarted,
} from "../src/runtime/courseLifecycle";
import { createLessonkitRuntime } from "../src/runtime/createLessonkitRuntime";

const baseEvent: TelemetryEvent = {
  name: "interaction",
  courseId: "course-1",
  timestamp: "2026-01-01T00:00:00.000Z",
};

afterEach(() => {
  resetTelemetryBuilderWarningsForTests();
  vi.unstubAllEnvs();
});

describe("coverage-full", () => {
  it("progress clears activeLessonId when completing the active lesson", () => {
    const progress = createProgressController();
    progress.setActiveLesson("l1", 100);
    progress.completeLesson("l1", 200);
    expect(progress.getState().activeLessonId).toBeUndefined();
  });

  it("progress omits durationMs when the lesson was never activated", () => {
    const progress = createProgressController();
    const result = progress.completeLesson("l1", 100);
    expect(result.didComplete).toBe(true);
    expect(result.durationMs).toBeUndefined();
  });

  it("pipeline course_started helpers no-op without courseId", () => {
    const storage = createNoopStorage();
    expect(hasCourseStartedPipelineDelivered(storage, "s", undefined)).toBe(false);
    markCourseStartedPipelineDelivered(storage, "s", undefined);
  });

  it("migrateCourseStartedMark moves tracking dedupe without session mark", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    markCourseStartedEmittedToTracking(storage, "old", "c1");
    migrateCourseStartedMark(storage, "old", "new", "c1");
    expect(store["lessonkit:course_started_tracking:new:c1"]).toBe("1");
    expect(store["lessonkit:course_started_tracking:old:c1"]).toBeUndefined();
  });

  it("slugifyId prefixes non-letter slugs and falls back when validation fails", () => {
    expect(slugifyId("123foo")).toBe("id-123foo");
    expect(slugifyId("1".repeat(100))).toBe("id");
  });

  it("deriveId returns the base slug when unused", () => {
    expect(deriveId("Intro")).toBe("intro");
  });

  it("buildTelemetryEvent throws for quiz_completed without lessonId", () => {
    expect(() =>
      buildTelemetryEvent({
        name: "quiz_completed",
        courseId: "c",
        data: { checkId: "q1", score: 1 },
      }),
    ).toThrow(/lessonId/);
  });

  it("tryBuildTelemetryEvent skips dev warning in production for quiz events", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      tryBuildTelemetryEvent({
        name: "quiz_answered",
        courseId: "c",
        data: { checkId: "q1", question: "Q", choice: "A", correct: false },
      }),
    ).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("telemetry pipeline swallows sink failures silently in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const pipeline = createTelemetryPipeline([
      {
        id: "fail",
        emit: () => {
          throw new Error("boom");
        },
      },
    ]);
    pipeline.emit({
      name: "course_started",
      timestamp: "t",
      courseId: "c",
      sessionId: "s",
    });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("tracking client omits dev warnings in production for sync sink errors", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = createTrackingClient({
      sink: () => {
        throw new Error("sync");
      },
      batch: { enabled: false },
    });
    expect(() => client.track(baseEvent)).toThrow("sync");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("tracking client flush resolves for empty buffer and after dispose", async () => {
    const client = createTrackingClient({
      batchSink: async () => {},
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 10 },
    });
    await client.flush?.();
    await client.dispose?.();
    await client.flush?.();
  });

  it("tracking client enables batching by default when batchSink is set", () => {
    const batchSink = vi.fn(async () => {});
    const client = createTrackingClient({ batchSink });
    client.track(baseEvent);
    expect(batchSink).not.toHaveBeenCalled();
  });

  it("plugin registry skips duplicate warnings in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    createPluginRegistry([
      { id: "dup", version: "1", kind: "analytics" },
      { id: "dup", version: "2", kind: "analytics" },
    ]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("plugin registry composeTrackingSink handles missing sink and null wraps", async () => {
    const ctx = { courseId: "course-1" as const, sessionId: "s1" };
    const host = createPluginRegistry([
      defineTelemetryPlugin({ id: "plain", version: "1", kind: "analytics" }),
      defineTelemetryPlugin({
        id: "null-wrap",
        version: "1",
        kind: "analytics",
        wrapTrackingSink: () => null as unknown as import("../src/index.js").TelemetrySink,
      }),
    ]);
    expect(host.composeTrackingSink(undefined, ctx)).toBeUndefined();

    const sink = vi.fn(async () => {});
    const wrapped = host.composeTrackingSink(sink, ctx)!;
    await wrapped(baseEvent);
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it("plugin registry runTelemetry stops chaining once an event is filtered", () => {
    const second = vi.fn(() => null);
    const host = createPluginRegistry([
      defineTelemetryPlugin({
        id: "drop",
        version: "1",
        kind: "analytics",
        onTelemetry: () => null,
      }),
      defineTelemetryPlugin({
        id: "second",
        version: "1",
        kind: "analytics",
        onTelemetry: second,
      }),
    ]);
    expect(host.runTelemetry(baseEvent, { courseId: "course-1", sessionId: "s1" })).toBeNull();
    expect(second).not.toHaveBeenCalled();
  });

  it("course lifecycle handles failed emit and duplicate completions", () => {
    const storage = createNoopStorage();
    const ctx = {
      courseId: "c" as const,
      sessionId: "s",
      storage,
      pluginHost: null,
      lxpackBridge: "auto" as const,
    };
    const failed = tryEmitCourseStarted(ctx, { emitCourseStartedEvent: () => false }, false);
    expect(failed).toEqual({ emitted: false, marked: false });

    const progress = createProgressController();
    progress.setActiveLesson("l1", 0);
    progress.completeLesson("l1", 10);
    expect(
      completeLessonWithTelemetry({
        progress,
        lessonId: "l1",
        nowMs: 20,
        emitLessonCompleted: () => {},
      }),
    ).toBe(false);

    progress.completeCourse();
    expect(
      completeCourseWithTelemetry({
        progress,
        nowMs: 30,
        emitLessonCompleted: () => {},
        emitCourseCompleted: () => {},
      }),
    ).toBe(false);
  });

  it("course lifecycle completes course without an active lesson", () => {
    const progress = createProgressController();
    const events: string[] = [];
    expect(
      completeCourseWithTelemetry({
        progress,
        nowMs: 10,
        emitLessonCompleted: (id) => events.push(`lesson:${id}`),
        emitCourseCompleted: () => events.push("course"),
      }),
    ).toBe(true);
    expect(events).toEqual(["course"]);
  });

  it("headless runtime covers config updates and duplicate lifecycle calls", () => {
    const events: string[] = [];
    const emit = (name: string) => events.push(name);
    const runtime = createLessonkitRuntime({ courseId: "c" });

    runtime.updateConfig({ plugins: createPluginRegistry([]) });
    runtime.setActiveLesson("l1", emit);
    runtime.setActiveLesson("l1", emit);
    runtime.completeLesson("l1", emit);
    runtime.completeLesson("l1", emit);
    runtime.completeCourse(emit);
    runtime.completeCourse(emit);

    expect(events.filter((e) => e === "lesson_started")).toHaveLength(1);
    expect(events.filter((e) => e === "course_completed")).toHaveLength(1);
  });

  it("tracking client no-ops without sink when batching is disabled", () => {
    const client = createTrackingClient({ batch: { enabled: false } });
    expect(() => client.track(baseEvent)).not.toThrow();
  });

  it("tracking client formats non-Error sync failures in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = createTrackingClient({
      sink: () => {
        throw "sync-string";
      },
      batch: { enabled: false },
    });
    expect(() => client.track(baseEvent)).toThrow();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("tracking sink failed"),
      "sync-string",
    );
    warn.mockRestore();
  });

  it("tracking client formats non-Error async failures in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = createTrackingClient({
      sink: async () => {
        throw "async-string";
      },
      batch: { enabled: false },
    });
    client.track(baseEvent);
    await new Promise((r) => setTimeout(r, 0));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("tracking sink failed"),
      "async-string",
    );
    warn.mockRestore();
  });

  it("tracking client swallows async rejections silently in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = createTrackingClient({
      sink: async () => {
        throw "async-string";
      },
      batch: { enabled: false },
    });
    client.track(baseEvent);
    await new Promise((r) => setTimeout(r, 0));
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("telemetry pipeline formats non-Error sink failures in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const pipeline = createTelemetryPipeline([
      {
        id: "fail",
        emit: () => {
          throw "string-failure";
        },
      },
    ]);
    pipeline.emit({
      name: "course_started",
      timestamp: "t",
      courseId: "c",
      sessionId: "s",
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('telemetry sink "fail" failed'),
      "string-failure",
    );
    warn.mockRestore();
  });

  it("headless runtime skips completion emits when prior lesson already completed", () => {
    const events: string[] = [];
    const emit = (name: string) => events.push(name);
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("l1", emit);
    runtime.completeLesson("l1", emit);
    runtime.setActiveLesson("l1", emit);
    runtime.setActiveLesson("l2", emit);
    expect(events.filter((e) => e === "lesson_completed")).toHaveLength(1);
  });

  it("headless runtime completeCourse skips active lesson emit when already completed", () => {
    const events: string[] = [];
    const emit = (name: string) => events.push(name);
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("l1", emit);
    runtime.completeLesson("l1", emit);
    runtime.setActiveLesson("l1", emit);
    runtime.completeCourse(emit);
    expect(events.filter((e) => e === "lesson_completed")).toHaveLength(1);
    expect(events.filter((e) => e === "course_completed")).toHaveLength(1);
  });

  it("headless runtime skips lesson_time_on_task when duration is unknown", () => {
    const events: string[] = [];
    const emit = (name: string) => events.push(name);
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.completeLesson("orphan", emit);
    expect(events).toEqual(["lesson_completed"]);
  });
});
