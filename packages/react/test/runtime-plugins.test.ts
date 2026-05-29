import { describe, expect, it, vi } from "vitest";
import { defineLessonkitPlugin, type TelemetryEvent } from "@lessonkit/core";
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
      defineLessonkitPlugin({
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
});
