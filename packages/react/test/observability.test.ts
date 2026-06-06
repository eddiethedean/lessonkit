import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import {
  wrapBatchSink,
  wrapTrackingSink,
  warnMissingProductionObservability,
} from "../src/runtime/observability";

describe("wrapBatchSink", () => {
  it("reports batchSink errors via onTelemetrySinkError", async () => {
    const onTelemetrySinkError = vi.fn();
    const batchSink = vi.fn(() => Promise.reject(new Error("batch fail")));
    const wrapped = wrapBatchSink(batchSink, { onTelemetrySinkError });
    await expect(wrapped?.([{ name: "interaction" } as TelemetryEvent])).rejects.toThrow(
      "batch fail",
    );
    expect(onTelemetrySinkError).toHaveBeenCalledWith(expect.any(Error), {
      sinkId: "tracking-batch",
    });
  });
});

describe("warnMissingProductionObservability", () => {
  it("does not warn in test environment", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    warnMissingProductionObservability(undefined, { trackingEnabled: true, xapiEnabled: true });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("wrapTrackingSink", () => {
  it("reports sync sink errors without rethrowing", () => {
    const onTelemetrySinkError = vi.fn();
    const sink = vi.fn(() => {
      throw new Error("boom");
    });
    const wrapped = wrapTrackingSink(sink, { onTelemetrySinkError });
    wrapped?.({ name: "interaction", timestamp: "t", courseId: "c" } as TelemetryEvent);
    expect(onTelemetrySinkError).toHaveBeenCalledWith(expect.any(Error), { sinkId: "tracking" });
  });

  it("reports async sink rejections", async () => {
    const onTelemetrySinkError = vi.fn();
    const sink = vi.fn(() => Promise.reject(new Error("async")));
    const wrapped = wrapTrackingSink(sink, { onTelemetrySinkError });
    wrapped?.({ name: "interaction", timestamp: "t", courseId: "c" } as TelemetryEvent);
    await Promise.resolve();
    expect(onTelemetrySinkError).toHaveBeenCalled();
  });
});
