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
