import type { LmsBridgeMode, TelemetryEvent } from "@lessonkit/core";
import {
  dispatchBridgeAction,
  forwardTelemetryToBridge,
  getLxpackBridge,
  mapLessonkitTelemetryToBridgeAction,
  telemetryEventToLessonkit,
} from "@lessonkit/lxpack/bridge";

/** @deprecated Use `LmsBridgeMode` from `@lessonkit/core`. */
export type LxpackBridgeMode = LmsBridgeMode;

export type ForwardTelemetryToLxpackOptions = {
  onBridgeMiss?: (event: TelemetryEvent) => void;
  allowedParentOrigins?: string[];
};

const BRIDGE_MISS_EVENT_NAMES = new Set<TelemetryEvent["name"]>([
  "course_started",
  "course_completed",
  "lesson_completed",
  "assessment_completed",
  "quiz_completed",
]);

export function forwardTelemetryToLxpack(
  event: TelemetryEvent,
  mode: LmsBridgeMode = "auto",
  opts?: ForwardTelemetryToLxpackOptions,
): void {
  const bridgeOpts = { allowedParentOrigins: opts?.allowedParentOrigins };
  if (
    mode === "auto" &&
    opts?.onBridgeMiss &&
    BRIDGE_MISS_EVENT_NAMES.has(event.name) &&
    !getLxpackBridge(undefined, bridgeOpts)
  ) {
    opts.onBridgeMiss(event);
  }
  forwardTelemetryToBridge(event, mode, undefined, {
    allowedParentOrigins: opts?.allowedParentOrigins,
  });
}

export {
  dispatchBridgeAction,
  getLxpackBridge,
  mapLessonkitTelemetryToBridgeAction,
  telemetryEventToLessonkit,
};
