import { afterEach, describe, expect, it, vi } from "vitest";
import { assertProductionCourseConfig } from "../src/runtime/productionGuard";

const fullObservability = {
  onTelemetrySinkError: () => undefined,
  onTelemetryBufferDrop: () => undefined,
  onXapiQueueDepth: () => undefined,
  onXapiQueueCap: () => undefined,
  onLxpackBridgeMiss: () => undefined,
  onXapiTransportError: () => undefined,
};

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

  it("throws when production has tracking enabled without delivery", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionCourseConfig({
        tracking: { enabled: true },
      }),
    ).toThrow(/tracking enabled but no sink/);
  });

  it("throws when production has implicit tracking without delivery", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertProductionCourseConfig({})).toThrow(/tracking enabled but no sink/);
  });

  it("throws when production xAPI enabled without transport", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionCourseConfig({
        tracking: { enabled: false },
        xapi: { enabled: true },
      }),
    ).toThrow(/xAPI enabled but no transport/);
  });

  it("throws when production xAPI omits onXapiTransportError", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionCourseConfig({
        tracking: { enabled: false },
        xapi: { enabled: true, transport: async () => undefined },
        observability: {
          onTelemetrySinkError: () => undefined,
          onTelemetryBufferDrop: () => undefined,
          onXapiQueueDepth: () => undefined,
          onXapiQueueCap: () => undefined,
          onLxpackBridgeMiss: () => undefined,
        },
      }),
    ).toThrow(/4 config\.observability/);
  });

  it("passes with real sinks and observability in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionCourseConfig({
        tracking: { sink: async () => undefined },
        xapi: { enabled: true, transport: async () => undefined },
        observability: fullObservability,
      }),
    ).not.toThrow();
  });

  it("allows console sinks in production when preview.allowConsoleTelemetry is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionCourseConfig({
        preview: { allowConsoleTelemetry: true },
        tracking: { sink: (event) => console.log(event) },
        xapi: { enabled: true, transport: (s) => console.log(s) },
        observability: fullObservability,
      }),
    ).not.toThrow();
  });

  it("still requires observability when allowConsoleTelemetry is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      assertProductionCourseConfig({
        preview: { allowConsoleTelemetry: true },
        tracking: { sink: (event) => console.log(event) },
      }),
    ).toThrow(/observability hooks/);
  });
});
