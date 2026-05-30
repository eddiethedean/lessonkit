import type { TelemetryEvent, TrackingClient } from "@lessonkit/core";
import { buildTelemetryEvent, tryBuildTelemetryEvent } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import type { LxpackBridgeMode } from "./lxpackBridge";
import { emitThroughPipeline, type LegacyEmitOptions } from "./telemetryPipeline";

let warnedMissingCourseId = false;

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { NODE_ENV?: string } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

export { buildTelemetryEvent, tryBuildTelemetryEvent };

export function emitTelemetry(
  tracking: TrackingClient,
  xapi: XAPIClient | null,
  event: TelemetryEvent,
  opts?: { lxpackBridge?: LxpackBridgeMode; extraSinks?: import("@lessonkit/core").TelemetryPipelineSink[] },
): void {
  if (!event.courseId) {
    if (isDevEnvironment() && !warnedMissingCourseId) {
      warnedMissingCourseId = true;
      console.warn("[lessonkit] telemetry event missing courseId");
    }
    return;
  }

  const legacy: LegacyEmitOptions = {
    tracking,
    xapi,
    lxpackBridge: opts?.lxpackBridge ?? "auto",
  };
  emitThroughPipeline(event, legacy, opts?.extraSinks);
}
