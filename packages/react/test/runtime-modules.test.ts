import { describe, expect, it, vi } from "vitest";
import { createInMemoryXAPIQueue } from "@lessonkit/xapi";
import type { TelemetryEvent, TrackingClient } from "@lessonkit/core";
import type { XAPIStatement, XAPITransport } from "@lessonkit/xapi";
import { createDefaultClock, createGlobalTimer, createNoopStorage, createSessionStoragePort } from "../src/runtime/ports";
import { createProgressController } from "../src/runtime/progress";
import { buildTelemetryEvent, createTrackingClient } from "@lessonkit/core";
import { createTrackingClientFromConfig, disposeTrackingClient } from "../src/runtime/telemetry";
import { createXapiClientFromConfig } from "../src/runtime/xapi";
import * as xapiMapModule from "@lessonkit/xapi";
import { emitThroughPipeline, createPipelineFromLegacyConfig } from "../src/runtime/telemetryPipeline";
import { normalizeComponentId } from "../src/runtime/validateComponentId";

describe("@lessonkit/react runtime modules", () => {
  it("normalizeComponentId validates generic id paths", () => {
    expect(normalizeComponentId("block-a", "blockId")).toBe("block-a");
    expect(normalizeComponentId("custom-id", "customField")).toBe("custom-id");
  });

  it("ports: createDefaultClock returns stable shapes", () => {
    const clock = createDefaultClock();
    expect(typeof clock.nowMs()).toBe("number");
    expect(typeof clock.nowIso()).toBe("string");
  });

  it("ports: createSessionStoragePort reads/writes when available", () => {
    const storage = createSessionStoragePort();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
    storage.removeItem?.("k");
    expect(storage.getItem("k")).toBeNull();
  });

  it("ports: createSessionStoragePort ignores removeItem errors", () => {
    const store: Record<string, string> = { k: "v" };
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
        return true;
      },
      removeItem: () => {
        throw new Error("quota");
      },
    });
    try {
      createSessionStoragePort().removeItem!("k");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("ports: createSessionStoragePort uses in-memory store when sessionStorage is missing", () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    try {
      Object.defineProperty(globalThis, "sessionStorage", {
        value: undefined,
        configurable: true,
      });

      const storage = createSessionStoragePort();
      storage.setItem("k", "v");
      expect(storage.getItem("k")).toBe("v");
    } finally {
      if (original) Object.defineProperty(globalThis, "sessionStorage", original);
    }
  });

  it("ports: createNoopStorage persists in memory", () => {
    const storage = createNoopStorage();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
  });

  it("ports: createGlobalTimer can schedule and clear", () => {
    vi.useFakeTimers();
    try {
      const timer = createGlobalTimer();
      const fn = vi.fn();
      const id = timer.setInterval(fn, 10);
      vi.advanceTimersByTime(25);
      expect(fn).toHaveBeenCalled();
      timer.clearInterval(id);
    } finally {
      vi.useRealTimers();
    }
  });

  it("progress: controller tracks active lesson, completion, and duration", () => {
    const progress = createProgressController();
    expect(progress.getState().courseCompleted).toBe(false);

    progress.setActiveLesson("lesson-1", 1000);
    expect(progress.getState().activeLessonId).toBe("lesson-1");

    const completed = progress.completeLesson("lesson-1", 1500);
    expect(completed.didComplete).toBe(true);
    expect(completed.durationMs).toBe(500);
    expect(progress.getState().completedLessonIds.has("lesson-1")).toBe(true);
    expect(progress.getState().activeLessonId).toBeUndefined();

    // idempotent
    expect(progress.completeLesson("lesson-1", 2000).didComplete).toBe(false);

    // duration is undefined when we never saw a start time
    const other = progress.completeLesson("lesson-2", 3000);
    expect(other.didComplete).toBe(true);
    expect(other.durationMs).toBeUndefined();

    expect(progress.completeCourse().didComplete).toBe(true);
    expect(progress.getState().courseCompleted).toBe(true);
    expect(progress.completeCourse().didComplete).toBe(false);
  });

  it("telemetry: buildTelemetryEvent accepts explicit timestamp", () => {
    const evt = buildTelemetryEvent({
      name: "lesson_completed",
      timestamp: "T",
      data: { lessonId: "l", durationMs: 1 },
      courseId: "c",
      lessonId: "l",
      sessionId: "s",
      attemptId: "a",
      user: { id: "u" },
    });
    expect(evt.timestamp).toBe("T");
    expect(evt.courseId).toBe("c");
  });

  it("telemetry: createTrackingClientFromConfig honors enabled=false", () => {
    const client = createTrackingClientFromConfig({ tracking: { enabled: false } });
    expect(typeof client.track).toBe("function");
  });

  it("telemetry: createTrackingClientFromConfig uses injected createClient", () => {
    const events: TelemetryEvent[] = [];
    const injected: TrackingClient = {
      track: (e) => {
        events.push(e);
        return true;
      },
    };
    const client = createTrackingClientFromConfig({ tracking: { createClient: () => injected } });
    client.track({ name: "interaction", timestamp: "t", courseId: "c" });
    expect(events).toHaveLength(1);
  });

  it("telemetry: createTrackingClientFromConfig builds default client from sinks", () => {
    const events: TelemetryEvent[] = [];
    const client = createTrackingClientFromConfig({
      tracking: {
        sink: (e) => void events.push(e),
      },
    });
    client.track({ name: "interaction", timestamp: "t", courseId: "c" });
    expect(events).toHaveLength(1);
  });

  it("telemetry: disposeTrackingClient calls flush+dispose when present", async () => {
    const flush = vi.fn();
    const dispose = vi.fn();
    await disposeTrackingClient({ track: () => true, flush, dispose });
    expect(flush).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("xapi: returns null when enabled=false", () => {
    const client = createXapiClientFromConfig({ courseId: "c", xapi: { enabled: false } }, createInMemoryXAPIQueue());
    expect(client).toBeNull();
  });

  it("xapi: returns null when no transport or client unless enabled=true", () => {
    const client = createXapiClientFromConfig({ courseId: "c" }, createInMemoryXAPIQueue());
    expect(client).toBeNull();
    const forced = createXapiClientFromConfig(
      { courseId: "c", xapi: { enabled: true } },
      createInMemoryXAPIQueue(),
    );
    expect(forced).not.toBeNull();
  });

  it("xapi: returns provided client when present", () => {
    const provided = { send: () => {}, flush: async () => {}, queueSize: () => 0, startedLesson: () => {}, completeLesson: () => {}, completeCourse: () => {} };
    const client = createXapiClientFromConfig({ courseId: "c", xapi: { client: provided } }, createInMemoryXAPIQueue());
    expect(client).toBe(provided);
  });

  it("xapi: builds baseId from courseId", async () => {
    const statements: XAPIStatement[] = [];
    const transport: XAPITransport = async (s) => void statements.push(s);
    const queue = createInMemoryXAPIQueue();

    const client = createXapiClientFromConfig({ courseId: "course-1", xapi: { transport } }, queue);
    if (!client) throw new Error("expected xapi client");

    client.startedLesson({ lessonId: "lesson-1" });
    // transport is async; allow microtask
    await Promise.resolve();

    expect(statements).toHaveLength(1);
    expect(statements[0]!.object.id).toBe("urn:lessonkit:course:course-1:lesson:lesson-1");
  });

  it("xapi: returns null when courseId is missing", () => {
    const queue = createInMemoryXAPIQueue();
    const client = createXapiClientFromConfig({ xapi: { transport: async () => {} } }, queue);
    expect(client).toBeNull();
  });

  it("telemetryPipeline: awaits xapi flush for lifecycle events", async () => {
    const flush = vi.fn(async () => {});
    const send = vi.fn();
    const tracking = { track: vi.fn() } as TrackingClient;
    const xapi = {
      send,
      flush,
      queueSize: () => 0,
      startedLesson: () => {},
      completeLesson: () => {},
      completeCourse: () => {},
    };
    await emitThroughPipeline(
      {
        name: "lesson_completed",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
        lessonId: "lesson-1",
        data: { lessonId: "lesson-1" },
      },
      { tracking, xapi, lxpackBridge: "off" },
    );
    expect(send).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it("telemetryPipeline: delivers lifecycle events to batch sink before xAPI flush", async () => {
    const order: string[] = [];
    const tracking = createTrackingClient({
      batchSink: async () => {
        order.push("batch");
      },
    });
    const xapi = {
      send: () => {
        order.push("xapi-send");
      },
      flush: async () => {
        order.push("xapi-flush");
      },
      queueSize: () => 0,
      startedLesson: () => {},
      completeLesson: () => {},
      completeCourse: () => {},
    };
    await emitThroughPipeline(
      {
        name: "lesson_completed",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
        lessonId: "lesson-1",
        data: { lessonId: "lesson-1" },
      },
      { tracking, xapi, lxpackBridge: "off" },
    );
    expect(order).toEqual(["batch", "xapi-send", "xapi-flush"]);
  });

  it("telemetryPipeline: emitThroughPipeline invokes extra sinks", async () => {
    const tracked: string[] = [];
    const tracking = {
      track: (e: TelemetryEvent) => {
        tracked.push(e.name);
        return true;
      },
    } satisfies TrackingClient;
    await emitThroughPipeline(
      {
        name: "course_started",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
      },
      { tracking, xapi: null, lxpackBridge: "off" },
      [{ id: "custom", emit: () => void tracked.push("custom") }],
    );
    expect(tracked).toContain("course_started");
    expect(tracked).toContain("custom");
  });

  it("telemetryPipeline: createPipelineFromLegacyConfig builds pipeline", () => {
    const tracking = { track: vi.fn() } as TrackingClient;
    const pipeline = createPipelineFromLegacyConfig({ tracking, xapi: null, lxpackBridge: "off" });
    expect(pipeline.sinks.length).toBeGreaterThan(0);
  });

  it("telemetryPipeline: pipeline split-brain — skips xAPI when tracking buffer drops event", async () => {
    const tracking = createTrackingClient({
      batchSink: async () => {
        throw new Error("batch sink unavailable");
      },
      batch: { maxBatchSize: 1001 },
    });
    for (let i = 0; i < 1000; i++) {
      expect(
        tracking.track({
          name: "interaction",
          timestamp: "t",
          courseId: "c",
          data: { i },
        }),
      ).toBe(true);
    }
    expect(
      tracking.track({
        name: "interaction",
        timestamp: "t",
        courseId: "c",
        data: { overflow: true },
      }),
    ).toBe(false);

    const send = vi.fn();
    const xapi = {
      send,
      flush: vi.fn(async () => {}),
      queueSize: () => 0,
      startedLesson: () => {},
      completeLesson: () => {},
      completeCourse: () => {},
    };
    await emitThroughPipeline(
      {
        name: "course_started",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
      },
      { tracking, xapi, lxpackBridge: "off" },
    );
    expect(send).not.toHaveBeenCalled();
  });

  it("telemetryPipeline: warns in dev when xAPI mapping throws", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(xapiMapModule, "telemetryEventToXAPIStatement").mockImplementation(() => {
      throw new Error("bad mapping");
    });
    try {
      const tracking = { track: vi.fn() } as TrackingClient;
      const xapi = {
        send: vi.fn(),
        flush: async () => {},
        queueSize: () => 0,
        startedLesson: () => {},
        completeLesson: () => {},
        completeCourse: () => {},
      };
      await emitThroughPipeline(
        { name: "interaction", timestamp: "t", courseId: "c" },
        { tracking, xapi, lxpackBridge: "off" },
      );
      expect(warn).toHaveBeenCalledWith(
        "[lessonkit] xAPI mapping skipped:",
        "bad mapping",
      );
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    }
  });

  it("telemetryPipeline: invokes onXapiMappingError in production when mapping throws", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onXapiMappingError = vi.fn();
    vi.spyOn(xapiMapModule, "telemetryEventToXAPIStatement").mockImplementation(() => {
      throw new Error("bad mapping");
    });
    try {
      const tracking = { track: vi.fn() } as TrackingClient;
      const xapi = {
        send: vi.fn(),
        flush: async () => {},
        queueSize: () => 0,
        startedLesson: () => {},
        completeLesson: () => {},
        completeCourse: () => {},
      };
      await emitThroughPipeline(
        { name: "interaction", timestamp: "t", courseId: "c" },
        { tracking, xapi, lxpackBridge: "off", onXapiMappingError },
      );
      expect(warn).not.toHaveBeenCalled();
      expect(onXapiMappingError).toHaveBeenCalledWith(expect.any(Error));
      expect(xapi.send).not.toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    }
  });

  it("telemetryPipeline: invokes onXapiTransportError when flush fails", async () => {
    const onXapiTransportError = vi.fn();
    const tracking = { track: vi.fn() } as TrackingClient;
    const xapi = {
      send: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error("transport down");
      }),
      queueSize: () => 0,
      startedLesson: () => {},
      completeLesson: () => {},
      completeCourse: () => {},
    };
    await emitThroughPipeline(
      {
        name: "lesson_completed",
        timestamp: "t",
        courseId: "c",
        sessionId: "s",
        lessonId: "lesson-1",
        data: { lessonId: "lesson-1" },
      },
      { tracking, xapi, lxpackBridge: "off", onXapiTransportError },
    );
    expect(onXapiTransportError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("telemetryPipeline: swallows mapping errors in production without observability hook", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(xapiMapModule, "telemetryEventToXAPIStatement").mockImplementation(() => {
      throw new Error("bad mapping");
    });
    try {
      const tracking = { track: vi.fn() } as TrackingClient;
      const xapi = {
        send: vi.fn(),
        flush: async () => {},
        queueSize: () => 0,
        startedLesson: () => {},
        completeLesson: () => {},
        completeCourse: () => {},
      };
      await emitThroughPipeline(
        { name: "interaction", timestamp: "t", courseId: "c" },
        { tracking, xapi, lxpackBridge: "off" },
      );
      expect(warn).not.toHaveBeenCalled();
      expect(xapi.send).not.toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    }
  });

  it("telemetryPipeline: swallows mapping errors when process is unavailable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(xapiMapModule, "telemetryEventToXAPIStatement").mockImplementation(() => {
      throw new Error("bad mapping");
    });
    const proc = (globalThis as typeof globalThis & { process?: { env?: Record<string, string> } })
      .process;
    try {
      Reflect.deleteProperty(globalThis as object, "process");
      const tracking = { track: vi.fn() } as TrackingClient;
      await emitThroughPipeline(
        { name: "interaction", timestamp: "t", courseId: "c" },
        {
          tracking,
          xapi: {
            send: vi.fn(),
            flush: async () => {},
            queueSize: () => 0,
            startedLesson: () => {},
            completeLesson: () => {},
            completeCourse: () => {},
          },
          lxpackBridge: "off",
        },
      );
      expect(warn).not.toHaveBeenCalled();
    } finally {
      if (proc !== undefined) {
        (globalThis as typeof globalThis & { process?: typeof proc }).process = proc;
      }
      vi.restoreAllMocks();
    }
  });
});

