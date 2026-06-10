import { afterEach, describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import { createCourseConfig } from "./courseConfig";

describe("createCourseConfig", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    vi.unstubAllEnvs();
    globalThis.fetch = originalFetch;
  });

  it("returns dev console sinks when proxy URLs are unset", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const config = createCourseConfig();

    expect(config.courseId).toBe("my-course");
    expect(config.lxpack?.bridge).toBe("off");
    expect(config.observability?.onTelemetrySinkError).toBeTypeOf("function");
    expect(config.observability?.onLxpackBridgeMiss).toBeTypeOf("function");

    config.tracking?.sink?.({
      name: "interaction",
      timestamp: "2026-01-01T00:00:00Z",
      courseId: "my-course",
    } as TelemetryEvent);
    expect(log).toHaveBeenCalledWith("[telemetry]", expect.any(Object));

    log.mockRestore();
  });

  it("invokes observability hooks without throwing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const config = createCourseConfig();

    config.observability?.onTelemetrySinkError?.(new Error("sink"), { sinkId: "tracking" });
    config.observability?.onTelemetryBufferDrop?.();
    config.observability?.onXapiQueueDepth?.(10);
    config.observability?.onXapiQueueDepth?.(60);
    config.observability?.onXapiQueueCap?.();
    config.observability?.onLxpackBridgeMiss?.({
      name: "course_completed",
      timestamp: "2026-01-01T00:00:00Z",
      courseId: "my-course",
    } as TelemetryEvent);
    config.observability?.onXapiTransportError?.(new Error("transport"));
    config.observability?.onXapiMappingError?.(new Error("mapping"));
    config.observability?.onLxpackBridgeError?.(new Error("bridge"));
    config.observability?.onInvalidSessionId?.({
      invalidId: "bad:id",
      fallbackId: "tab-1",
      source: "provided",
    });

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("uses fetch transports when proxy URLs are set", async () => {
    vi.stubEnv("VITE_XAPI_PROXY_URL", "https://lrs.example/statements");
    vi.stubEnv("VITE_ANALYTICS_URL", "https://analytics.example/events");
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    globalThis.fetch = fetchMock as typeof fetch;

    const config = createCourseConfig();

    expect(config.tracking?.batchSink).toBeTypeOf("function");
    expect(config.xapi?.transport).toBeTypeOf("function");

    await config.tracking?.batchSink?.([
      { name: "course_started", timestamp: "t", courseId: "my-course" } as TelemetryEvent,
    ]);
    await config.xapi?.transport?.({
      id: "s1",
      timestamp: "2026-01-01T00:00:00Z",
      verb: "http://adlnet.gov/expapi/verbs/completed",
      object: { id: "https://example.com/a" },
    });

    expect(fetchMock).toHaveBeenCalled();
  });

  it("skips production guard when MODE is test even with proxy URLs set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MODE", "test");
    vi.stubEnv("VITE_XAPI_PROXY_URL", "https://lrs.example/statements");
    vi.stubEnv("VITE_ANALYTICS_URL", "https://analytics.example/events");

    expect(() => createCourseConfig()).not.toThrow();
  });

  it("throws when production guard is enforced with console sinks", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MODE", "production");

    expect(() => createCourseConfig()).toThrow(/console telemetry sinks|observability hooks/);
  });
});
