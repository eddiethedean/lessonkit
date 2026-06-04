import { describe, expect, it, vi } from "vitest";
import type { TelemetryEvent } from "@lessonkit/core";
import { wrapTrackingSink } from "../src/runtime/observability";

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
