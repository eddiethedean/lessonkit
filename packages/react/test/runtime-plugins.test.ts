import { describe, expect, it, vi } from "vitest";
import { defineTelemetryPlugin, type TelemetryEvent } from "@lessonkit/core";
import { createTrackingClient } from "@lessonkit/core";
import {
  buildPluginContext,
  createReactPluginHost,
  emitTelemetryWithPlugins,
} from "../src/runtime/plugins";
import { awaitTelemetryFlights, registerTelemetryFlight } from "../src/runtime/telemetryFlights";

const baseEvent: TelemetryEvent = {
  name: "interaction",
  courseId: "course-1",
  timestamp: "2026-01-01T00:00:00.000Z",
};

describe("runtime plugins", () => {
  it("createReactPluginHost returns null without plugins", () => {
    expect(createReactPluginHost(undefined)).toBeNull();
    expect(createReactPluginHost([])).toBeNull();
  });

  it("emitTelemetryWithPlugins drops events filtered by plugins", () => {
    const sink = vi.fn();
    const host = createReactPluginHost([
      defineTelemetryPlugin({
        id: "drop",
        version: "1",
        kind: "analytics",
        onTelemetry: () => null,
      }),
    ]);
    emitTelemetryWithPlugins({
      pluginHost: host,
      tracking: createTrackingClient({ sink, batch: { enabled: false } }),
      xapi: null,
      event: baseEvent,
      pluginCtx: buildPluginContext({ courseId: "course-1", sessionId: "s1" }),
    });
    expect(sink).not.toHaveBeenCalled();
  });

  it("emitTelemetryWithPlugins skipPluginPass bypasses plugin filtering", () => {
    const sink = vi.fn();
    const host = createReactPluginHost([
      defineTelemetryPlugin({
        id: "drop",
        version: "1",
        kind: "analytics",
        onTelemetry: () => null,
      }),
    ]);
    emitTelemetryWithPlugins({
      pluginHost: host,
      tracking: createTrackingClient({ sink, batch: { enabled: false } }),
      xapi: null,
      event: baseEvent,
      skipPluginPass: true,
      pluginCtx: buildPluginContext({ courseId: "course-1", sessionId: "s1" }),
    });
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it("batchSink wrapper uses deliverTelemetryBatch without dropping buffered events", async () => {
    const batches: TelemetryEvent[][] = [];
    let passCount = 0;
    const host = createReactPluginHost([
      defineTelemetryPlugin({
        id: "once",
        version: "1",
        kind: "analytics",
        onTelemetry: (event) => {
          passCount += 1;
          return passCount === 1 ? event : null;
        },
      }),
    ])!;
    const userBatchSink = vi.fn(async (events: TelemetryEvent[]) => {
      batches.push(events);
    });
    const ctx = buildPluginContext({ courseId: "course-1", sessionId: "s1" });
    const batchSink = (events: TelemetryEvent[]) => {
      const delivered = host.deliverTelemetryBatch(events, ctx);
      return userBatchSink(delivered);
    };
    const tracking = createTrackingClient({
      batchSink,
      batch: { enabled: true, flushIntervalMs: 0, maxBatchSize: 10 },
    });
    emitTelemetryWithPlugins({
      pluginHost: host,
      tracking,
      xapi: null,
      event: baseEvent,
      pluginCtx: ctx,
    });
    await tracking.flush?.();
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(1);
  });

  it("emitTelemetryWithPlugins returns awaitable pipeline for lifecycle events", async () => {
    const order: string[] = [];
    const tracking = createTrackingClient({
      batchSink: async () => {
        order.push("batch");
      },
    });
    let releaseFlush!: () => void;
    const flushGate = new Promise<void>((resolve) => {
      releaseFlush = resolve;
    });
    const xapi = {
      send: () => {
        order.push("xapi-send");
      },
      flush: async () => {
        order.push("xapi-flush-wait");
        await flushGate;
        order.push("xapi-flush-done");
      },
      queueSize: () => 0,
      startedLesson: () => {},
      completeLesson: () => {},
      completeCourse: () => {},
    };
    const result = emitTelemetryWithPlugins({
      pluginHost: null,
      tracking,
      xapi,
      event: {
        name: "lesson_completed",
        courseId: "course-1",
        sessionId: "s1",
        lessonId: "lesson-1",
        timestamp: "2026-01-01T00:00:00.000Z",
        data: { lessonId: "lesson-1" },
      },
      pluginCtx: buildPluginContext({ courseId: "course-1", sessionId: "s1" }),
    });
    expect(result).toBeInstanceOf(Promise);
    order.push("after-emit-sync");
    releaseFlush();
    await result;
    expect(order).toContain("batch");
    expect(order).toContain("xapi-send");
    expect(order).toContain("xapi-flush-wait");
    expect(order).toContain("xapi-flush-done");
    expect(order.indexOf("after-emit-sync")).toBeLessThan(order.indexOf("xapi-flush-done"));
  });

  it("registerTelemetryFlight tracks pending promises until settled", async () => {
    const flights = new Set<Promise<void>>();
    let resolve!: () => void;
    const pending = new Promise<void>((r) => {
      resolve = r;
    });
    registerTelemetryFlight(flights, pending);
    expect(flights.size).toBe(1);
    resolve();
    await pending;
    await Promise.resolve();
    expect(flights.size).toBe(0);
    await awaitTelemetryFlights(flights);
  });
});
