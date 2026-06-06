import type { TelemetryEvent, TelemetrySink } from "../telemetryTypes";
import { warnDev } from "./env";

/** Invokes a telemetry sink; returns false when sync throw or async rejection occurs. */
export async function invokeTrackingSinkWithResult(
  sink: TelemetrySink,
  event: TelemetryEvent,
): Promise<boolean> {
  try {
    const result = sink(event);
    if (result != null && typeof (result as Promise<void>).then === "function") {
      await result;
    }
    return true;
  } catch (err) {
    warnDev("[lessonkit] tracking sink failed:", err);
    return false;
  }
}

/** Invokes a telemetry sink; logs dev warnings and swallows async rejections. */
export function invokeTrackingSink(sink: TelemetrySink, event: TelemetryEvent): void {
  let result: void | Promise<void>;
  try {
    result = sink(event);
  } catch (err) {
    warnDev("[lessonkit] tracking sink failed:", err);
    throw err;
  }
  if (result != null && typeof (result as Promise<void>).catch === "function") {
    void (result as Promise<void>).catch((err) => warnDev("[lessonkit] tracking sink failed:", err));
  }
}

/** Invokes a pipeline sink by id; never throws. */
export function invokePipelineSink(sinkId: string, emit: () => void | Promise<void>): void {
  let result: void | Promise<void>;
  try {
    result = emit();
  } catch (err) {
    warnDev(`[lessonkit] telemetry sink "${sinkId}" failed:`, err);
    return;
  }
  if (result != null && typeof (result as Promise<void>).catch === "function") {
    void (result as Promise<void>).catch((err) =>
      warnDev(`[lessonkit] telemetry sink "${sinkId}" failed:`, err),
    );
  }
}
