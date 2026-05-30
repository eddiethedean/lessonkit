import { describe, expect, it, vi } from "vitest";
import { defineTelemetryPlugin, type TelemetryEvent } from "@lessonkit/core";
import { createTrackingClient } from "@lessonkit/core";
import {
  buildPluginContext,
  createReactPluginHost,
  emitTelemetryWithPlugins,
} from "../src/runtime/plugins";

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
});
