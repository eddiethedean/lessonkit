import { afterEach, describe, expect, it, vi } from "vitest";
import { assertProductionCourseConfig } from "../src/runtime/productionGuard";

describe("assertProductionCourseConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows console sinks in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() =>
      assertProductionCourseConfig({
        tracking: { sink: (event) => console.log(event) },
        xapi: { enabled: true, transport: (s) => console.log(s) },
      }),
    ).not.toThrow();
  });

  it("throws when production uses console telemetry sink", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionCourseConfig({
        tracking: { sink: (event) => console.log(event) },
        observability: {
          onTelemetrySinkError: () => undefined,
          onTelemetryBufferDrop: () => undefined,
          onXapiQueueDepth: () => undefined,
          onXapiQueueCap: () => undefined,
          onLxpackBridgeMiss: () => undefined,
        },
      }),
    ).toThrow(/console telemetry sinks/);
  });

  it("throws when production omits observability hooks", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionCourseConfig({
        tracking: { sink: async () => undefined },
        xapi: { enabled: true, transport: async () => undefined },
      }),
    ).toThrow(/observability hooks/);
  });

  it("passes with real sinks and observability in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionCourseConfig({
        tracking: { sink: async () => undefined },
        xapi: { enabled: true, transport: async () => undefined },
        observability: {
          onTelemetrySinkError: () => undefined,
          onTelemetryBufferDrop: () => undefined,
          onXapiQueueDepth: () => undefined,
          onXapiQueueCap: () => undefined,
          onLxpackBridgeMiss: () => undefined,
        },
      }),
    ).not.toThrow();
  });
});
