import type { TelemetryEvent, TrackingClient } from "@lessonkit/core";
import { buildTelemetryEvent, tryBuildTelemetryEvent } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import type { LxpackBridgeMode } from "./lxpackBridge";
import { emitThroughPipeline, type LegacyEmitOptions } from "./telemetryPipeline";

let warnedMissingCourseId = false;

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

export { buildTelemetryEvent, tryBuildTelemetryEvent };

export function emitTelemetry(
  tracking: TrackingClient,
  xapi: XAPIClient | null,
  event: TelemetryEvent,
  opts?: {
    lxpackBridge?: LxpackBridgeMode;
    allowedParentOrigins?: string[];
    extraSinks?: import("@lessonkit/core").TelemetryPipelineSink[];
    onLxpackBridgeMiss?: (event: TelemetryEvent) => void;
    onLxpackBridgeError?: import("./observability").LessonkitObservabilityConfig["onLxpackBridgeError"];
    onXapiMappingError?: import("./observability").LessonkitObservabilityConfig["onXapiMappingError"];
    onXapiTransportError?: import("./observability").LessonkitObservabilityConfig["onXapiTransportError"];
  },
): void | Promise<void> {
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
    allowedParentOrigins: opts?.allowedParentOrigins,
    onLxpackBridgeMiss: opts?.onLxpackBridgeMiss,
    onLxpackBridgeError: opts?.onLxpackBridgeError,
    onXapiMappingError: opts?.onXapiMappingError,
    onXapiTransportError: opts?.onXapiTransportError,
  };
  return emitThroughPipeline(event, legacy, opts?.extraSinks);
}
