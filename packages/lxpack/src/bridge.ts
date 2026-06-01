import type { TelemetryEvent } from "@lessonkit/core";
import type { CheckId, LessonId } from "@lessonkit/core";
import {
  getLxpackBridge as getLxpackBridgeFromParent,
  normalizePassingThreshold,
  normalizeScore,
  type LxpackBridgeSubmitAssessmentPayload,
  type LxpackBridgeV1,
} from "@lxpack/spa-bridge";

export type { LxpackBridgeSubmitAssessmentPayload, LxpackBridgeV1 } from "@lxpack/spa-bridge";
export {
  createLxpackBridgeHost,
  DEFAULT_BRIDGE_PASSING_SCORE,
  getLxpackBridge,
  LXPACK_BRIDGE_VERSIONS,
  normalizePassingThreshold,
  normalizeScore,
  supportedBridgeVersions,
} from "@lxpack/spa-bridge";

export type {
  LessonkitBridgeAction,
  LessonkitTelemetryEvent,
  LessonkitTelemetryEventName,
  TrackingSchemaEvent,
} from "@lxpack/tracking-schema";
export {
  LESSONKIT_TELEMETRY_EVENTS,
  mapLessonkitTelemetryToBridgeAction,
  mapLessonkitTelemetryToLxpack,
} from "@lxpack/tracking-schema";
import { mapLessonkitTelemetryToBridgeAction } from "@lxpack/tracking-schema";

import { telemetryEventToLessonkit } from "./telemetry";

type LxpackBridgeHost = {
  lxpackBridge?: { v1?: LxpackBridgeV1 };
  /** @deprecated Pre-v0.5 host alias; prefer `lxpackBridge.v1`. */
  lxpack?: LxpackBridgeV1;
};

export { telemetryEventToLessonkit };

/**
 * Scale a raw quiz score to 0–1 for the LXPack parent bridge.
 * Returns null when `score` is missing or not finite (caller should skip submit).
 */
export function normalizeAssessmentScore(opts: {
  score?: number;
  maxScore?: number;
}): number | null {
  if (typeof opts.score !== "number" || !Number.isFinite(opts.score)) {
    return null;
  }
  return normalizeScore({ score: opts.score, maxScore: opts.maxScore });
}

/**
 * Scale a raw passing threshold to 0–1 for the LXPack parent bridge.
 * Delegates to `@lxpack/spa-bridge` (default 0.7 when omitted).
 */
export function normalizeAssessmentPassingScore(opts?: {
  passingScore?: number;
  maxScore?: number;
}): number {
  return normalizePassingThreshold({
    passingScore: opts?.passingScore,
    maxScore: opts?.maxScore,
  });
}

function getBridge(parentWindow?: Window): LxpackBridgeV1 | null {
  const fromSdk = getLxpackBridgeFromParent(parentWindow);
  if (fromSdk) return fromSdk;
  if (typeof window === "undefined") return null;
  const parent = (parentWindow ?? window.parent) as (Window & LxpackBridgeHost) | null;
  if (!parent || parent === window) return null;
  return parent.lxpack ?? null;
}

export type LxpackBridgeMode = "auto" | "off";

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

/** Apply a mapped bridge action to an LXPack bridge instance. */
export function dispatchBridgeAction(
  bridge: LxpackBridgeV1,
  action: ReturnType<typeof mapLessonkitTelemetryToBridgeAction>,
): void {
  if (!action) return;
  try {
    dispatchBridgeActionInner(bridge, action);
  } catch (err) {
    if (isDevEnvironment()) {
      console.warn(
        "[lessonkit/lxpack] lxpack bridge action failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }
}

function dispatchBridgeActionInner(
  bridge: LxpackBridgeV1,
  action: ReturnType<typeof mapLessonkitTelemetryToBridgeAction>,
): void {
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

/** Resolve bridge and dispatch a telemetry-derived action. */
export function forwardTelemetryToBridge(
  event: TelemetryEvent,
  mode: LxpackBridgeMode = "auto",
  parentWindow?: Window,
): void {
  if (mode === "off") return;
  const bridge = getBridge(parentWindow);
  if (!bridge) return;
  const lessonkitEvent = telemetryEventToLessonkit(event);
  if (!lessonkitEvent) return;
  const action = mapLessonkitTelemetryToBridgeAction(lessonkitEvent);
  dispatchBridgeAction(bridge, action);
}

export function createLxpackBridge(): LxpackBridgeV1 | null {
  return getBridge();
}

export function notifyLxpackLessonComplete(lessonId: LessonId): boolean {
  const bridge = getBridge();
  if (!bridge?.completeLesson) return false;
  bridge.completeLesson(lessonId);
  return true;
}

export function notifyLxpackCourseComplete(): boolean {
  const bridge = getBridge();
  if (!bridge?.completeCourse) return false;
  bridge.completeCourse();
  return true;
}

/**
 * Submit assessment results to the parent LXPack bridge.
 * `score` must already be on a 0–1 scale (use `normalizeAssessmentScore` for raw points).
 */
export function notifyLxpackAssessment(
  payload: LxpackBridgeSubmitAssessmentPayload & { id: CheckId },
): boolean {
  const bridge = getBridge();
  if (!bridge?.submitAssessment) return false;
  bridge.submitAssessment(payload);
  return true;
}
