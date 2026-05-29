import type { TelemetryEvent } from "@lessonkit/core";
import {
  getLxpackBridge as getLxpackBridgeFromSdk,
  mapLessonkitTelemetryToBridgeAction,
  normalizePassingThreshold,
  normalizeScore,
  telemetryEventToLessonkit,
  type LxpackBridgeV1,
} from "@lessonkit/lxpack/bridge";

export type LxpackBridgeMode = "auto" | "off";

/** @deprecated Bridge mode is passed per call; this is a no-op kept for compatibility. */
export function setLxpackBridgeMode(_mode: LxpackBridgeMode): void {}

function getBridge(): LxpackBridgeV1 | null {
  const fromSdk = getLxpackBridgeFromSdk();
  if (fromSdk) return fromSdk;
  if (typeof window === "undefined") return null;
  const parent = window.parent as {
    lxpackBridge?: { v1?: LxpackBridgeV1 };
    /** @deprecated Pre-v0.5 host alias */
    lxpack?: LxpackBridgeV1;
  } | null;
  if (!parent || parent === window) return null;
  return parent.lxpack ?? null;
}

function applyBridgeAction(bridge: LxpackBridgeV1, action: ReturnType<typeof mapLessonkitTelemetryToBridgeAction>): void {
  if (!action) return;
  switch (action.kind) {
    case "completeLesson":
      bridge.completeLesson?.(action.lessonId);
      return;
    case "completeCourse":
      bridge.completeCourse?.();
      return;
    case "submitAssessment": {
      const scaled = normalizeScore({
        score: action.score,
        maxScore: action.maxScore,
      });
      if (scaled === null) return;
      bridge.submitAssessment?.({
        id: action.id,
        score: scaled,
        passingScore: normalizePassingThreshold({
          passingScore: action.passingScore,
          maxScore: action.maxScore,
        }),
        maxScore: action.maxScore,
      });
      return;
    }
    case "track":
      bridge.track?.(action.event);
      return;
    default:
      return;
  }
}

export function forwardTelemetryToLxpack(
  event: TelemetryEvent,
  mode: LxpackBridgeMode = "auto",
): void {
  if (mode === "off") return;
  const bridge = getBridge();
  if (!bridge) return;

  const lessonkitEvent = telemetryEventToLessonkit(event);
  if (!lessonkitEvent) return;

  const action = mapLessonkitTelemetryToBridgeAction(lessonkitEvent);
  applyBridgeAction(bridge, action);
}
