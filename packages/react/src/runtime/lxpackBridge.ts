import type { TelemetryEvent } from "@lessonkit/core";
import {
  dispatchBridgeAction,
  forwardTelemetryToBridge,
  getLxpackBridge,
  mapLessonkitTelemetryToBridgeAction,
  telemetryEventToLessonkit,
  type LxpackBridgeMode,
} from "@lessonkit/lxpack/bridge";

export type { LxpackBridgeMode };

/** @deprecated Bridge mode is passed per call; this is a no-op kept for compatibility. */
export function setLxpackBridgeMode(_mode: LxpackBridgeMode): void {}

export function forwardTelemetryToLxpack(
  event: TelemetryEvent,
  mode: LxpackBridgeMode = "auto",
): void {
  forwardTelemetryToBridge(event, mode);
}

export {
  dispatchBridgeAction,
  getLxpackBridge,
  mapLessonkitTelemetryToBridgeAction,
  telemetryEventToLessonkit,
};
