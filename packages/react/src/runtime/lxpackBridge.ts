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

const BRIDGE_MISS_EVENT_NAMES = new Set<TelemetryEvent["name"]>([
  "course_completed",
  "lesson_completed",
  "assessment_completed",
  "quiz_completed",
]);

export function forwardTelemetryToLxpack(
  event: TelemetryEvent,
  mode: LxpackBridgeMode = "auto",
  opts?: { onBridgeMiss?: (event: TelemetryEvent) => void },
): void {
  if (
    mode === "auto" &&
    opts?.onBridgeMiss &&
    BRIDGE_MISS_EVENT_NAMES.has(event.name) &&
    !getLxpackBridge()
  ) {
    opts.onBridgeMiss(event);
  }
  forwardTelemetryToBridge(event, mode);
}

export {
  dispatchBridgeAction,
  getLxpackBridge,
  mapLessonkitTelemetryToBridgeAction,
  telemetryEventToLessonkit,
};
