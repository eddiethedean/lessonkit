import type { CheckId, LessonId, LmsBridgeMode, TelemetryEvent } from "@lessonkit/core";
import {
  getLxpackBridge as getLxpackBridgeFromParent,
  type LxpackBridgeSubmitAssessmentPayload,
  type LxpackBridgeV1,
} from "@lxpack/spa-bridge";

export type { LxpackBridgeSubmitAssessmentPayload, LxpackBridgeV1 } from "@lxpack/spa-bridge";
export {
  createLxpackBridgeHost,
  DEFAULT_BRIDGE_PASSING_SCORE,
  LXPACK_BRIDGE_VERSIONS,
  supportedBridgeVersions,
} from "@lxpack/spa-bridge";

/** 100% required when telemetry omits passingScore — matches React SPA default (maxScore). */
const DEFAULT_BRIDGE_PASSING_SCORE = 1;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Scale a raw quiz score to 0–1 for the LXPack parent bridge.
 * When `maxScore > 1`, always treats `score` as raw points (fixes partial-credit 1/N cases).
 */
export function normalizeScore(raw: { score?: number; maxScore?: number }): number | null {
  const { score, maxScore } = raw;
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  if (typeof maxScore === "number" && maxScore > 0) {
    return clamp01(score / maxScore);
  }
  if (score > 1 && score <= 100) {
    return clamp01(score / 100);
  }
  return clamp01(score);
}

/** Scale a raw passing threshold to 0–1 for the LXPack parent bridge. */
export function normalizePassingThreshold(raw?: {
  passingScore?: number;
  maxScore?: number;
}): number {
  const { passingScore, maxScore } = raw ?? {};
  if (typeof passingScore !== "number" || !Number.isFinite(passingScore)) {
    return DEFAULT_BRIDGE_PASSING_SCORE;
  }
  if (typeof maxScore === "number" && maxScore > 1) {
    return clamp01(passingScore / maxScore);
  }
  if (typeof maxScore === "number" && maxScore <= 1) {
    return clamp01(passingScore);
  }
  if (passingScore > 1 && passingScore <= 100) {
    return clamp01(passingScore / 100);
  }
  return clamp01(passingScore);
}

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

import {
  answeredTelemetryToBridgeTrackEvent,
  branchTelemetryToBridgeTrackEvent,
  telemetryEventToLessonkit,
} from "./telemetry";

type LxpackBridgeHost = {
  lxpackBridge?: { v1?: LxpackBridgeV1 };
  /** @deprecated Pre-v0.5 host alias; prefer `lxpackBridge.v1`. */
  lxpack?: LxpackBridgeV1;
};

export { telemetryEventToLessonkit, branchTelemetryToBridgeTrackEvent, BRANCH_TELEMETRY_EVENTS } from "./telemetry";

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
 * Default 1.0 (100%) when omitted — matches React SPA default.
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

export type BridgeAccessOptions = {
  /** Allowed parent-frame origins (scheme + host + port). When set, bridge calls require a matching origin. */
  allowedParentOrigins?: string[];
  /** LMS bridge mode; `"auto"` in production requires `allowedParentOrigins`. */
  mode?: LxpackBridgeMode;
  onBridgeError?: (err: unknown) => void;
};

/** Resolve the parent frame origin when embedded (same-origin parent or document.referrer fallback). */
export function resolveParentOrigin(parentWindow?: Window): string | null {
  if (typeof window === "undefined") return null;
  const parent = parentWindow ?? window.parent;
  if (!parent || parent === window) return null;
  try {
    return parent.location.origin;
  } catch {
    // Cross-origin parent: do not trust document.referrer for allowlist matching.
    return null;
  }
}

function isProductionRuntime(): boolean {
  try {
    if ((import.meta as { env?: { PROD?: boolean } }).env?.PROD === true) return true;
  } catch {
    // no import.meta
  }
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "production";
}

/** Returns true when no allowlist is configured or the resolved parent origin is listed. */
export function isParentOriginAllowed(
  allowedParentOrigins: string[] | undefined,
  parentWindow?: Window,
  mode?: LxpackBridgeMode,
): boolean {
  if (mode === "off") return false;
  // Production: fail closed when no allowlist (all entry points, not only mode "auto").
  if (isProductionRuntime() && !allowedParentOrigins?.length) return false;
  if (!allowedParentOrigins?.length) return true;
  const origin = resolveParentOrigin(parentWindow);
  if (!origin) return false;
  return allowedParentOrigins.includes(origin);
}

function getBridge(parentWindow?: Window, opts?: BridgeAccessOptions): LxpackBridgeV1 | null {
  const mode = opts?.mode ?? "auto";
  if (!isParentOriginAllowed(opts?.allowedParentOrigins, parentWindow, mode)) return null;
  const fromSdk = getLxpackBridgeFromParent(parentWindow);
  if (fromSdk) return fromSdk;
  if (typeof window === "undefined") return null;
  const parent = (parentWindow ?? window.parent) as (Window & LxpackBridgeHost) | null;
  if (!parent || parent === window) return null;
  return parent.lxpackBridge?.v1 ?? parent.lxpack ?? null;
}

/** Resolve the LXPack parent bridge when the parent origin passes validation. */
export function getLxpackBridge(
  parentWindow?: Window,
  opts?: BridgeAccessOptions,
): LxpackBridgeV1 | null {
  return getBridge(parentWindow, opts);
}

/** @deprecated Use `LmsBridgeMode` from `@lessonkit/core`. */
export type LxpackBridgeMode = LmsBridgeMode;

function isDevEnvironment(): boolean {
  try {
    if ((import.meta as { env?: { DEV?: boolean; PROD?: boolean } }).env?.DEV === true) return true;
    if ((import.meta as { env?: { PROD?: boolean } }).env?.PROD === true) return false;
  } catch {
    // no import.meta
  }
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

function handleBridgeError(err: unknown, onBridgeError?: (err: unknown) => void): void {
  onBridgeError?.(err);
  if (isDevEnvironment()) {
    console.warn(
      "[lessonkit/lxpack] lxpack bridge action failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

/** Apply a mapped bridge action to an LXPack bridge instance. */
export function dispatchBridgeAction(
  bridge: LxpackBridgeV1,
  action: ReturnType<typeof mapLessonkitTelemetryToBridgeAction>,
  opts?: { onBridgeError?: (err: unknown) => void },
): void {
  if (!action) return;
  try {
    dispatchBridgeActionInner(bridge, action);
  } catch (err) {
    handleBridgeError(err, opts?.onBridgeError);
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
function forwardAssessmentCompletedToBridge(
  bridge: LxpackBridgeV1,
  event: TelemetryEvent & { name: "assessment_completed" },
  onBridgeMiss?: (event: TelemetryEvent) => void,
): void {
  const data = event.data;
  const scaled = normalizeAssessmentScore({
    score: data.score,
    maxScore: data.maxScore,
  });
  if (scaled === null) {
    onBridgeMiss?.(event);
    return;
  }
  bridge.submitAssessment?.({
    id: data.checkId,
    score: scaled,
    passingScore: normalizeAssessmentPassingScore({
      passingScore: data.passingScore,
      maxScore: data.maxScore,
    }),
    maxScore: data.maxScore,
  });
}

export type ForwardTelemetryToBridgeOptions = {
  onBridgeError?: (err: unknown) => void;
  /** Called when assessment_completed cannot be forwarded (e.g. missing/invalid score). */
  onBridgeMiss?: (event: TelemetryEvent) => void;
  allowedParentOrigins?: string[];
};

export function forwardTelemetryToBridge(
  event: TelemetryEvent,
  mode: LxpackBridgeMode = "auto",
  parentWindow?: Window,
  opts?: ForwardTelemetryToBridgeOptions,
): void {
  if (mode === "off") return;
  const bridge = getBridge(parentWindow, {
    allowedParentOrigins: opts?.allowedParentOrigins,
    mode,
  });
  if (!bridge) return;
  try {
    if (event.name === "assessment_completed") {
      forwardAssessmentCompletedToBridge(bridge, event, opts?.onBridgeMiss);
      return;
    }
    const answeredTrack = answeredTelemetryToBridgeTrackEvent(event);
    if (answeredTrack) {
      bridge.track?.(answeredTrack);
      return;
    }
    const branchTrack = branchTelemetryToBridgeTrackEvent(event);
    if (branchTrack) {
      bridge.track?.(branchTrack);
      return;
    }
    const lessonkitEvent = telemetryEventToLessonkit(event);
    if (!lessonkitEvent) return;
    const action = mapLessonkitTelemetryToBridgeAction(lessonkitEvent);
    dispatchBridgeActionInner(bridge, action);
  } catch (err) {
    handleBridgeError(err, opts?.onBridgeError);
  }
}

export function createLxpackBridge(opts?: BridgeAccessOptions): LxpackBridgeV1 | null {
  return getBridge(undefined, opts);
}

export function notifyLxpackLessonComplete(
  lessonId: LessonId,
  opts?: BridgeAccessOptions,
): boolean {
  const bridge = getBridge(undefined, opts);
  if (!bridge?.completeLesson) return false;
  try {
    bridge.completeLesson(lessonId);
    return true;
  } catch (err) {
    handleBridgeError(err, opts?.onBridgeError);
    return false;
  }
}

export function notifyLxpackCourseComplete(opts?: BridgeAccessOptions): boolean {
  const bridge = getBridge(undefined, opts);
  if (!bridge?.completeCourse) return false;
  try {
    bridge.completeCourse();
    return true;
  } catch (err) {
    handleBridgeError(err, opts?.onBridgeError);
    return false;
  }
}

/**
 * Submit assessment results to the parent LXPack bridge.
 * Raw point scores are normalized to 0–1 before submission.
 */
export function notifyLxpackAssessment(
  payload: LxpackBridgeSubmitAssessmentPayload & { id: CheckId },
  opts?: BridgeAccessOptions,
): boolean {
  const bridge = getBridge(undefined, opts);
  if (!bridge?.submitAssessment) return false;
  const scaled = normalizeAssessmentScore({
    score: payload.score,
    maxScore: payload.maxScore,
  });
  if (scaled === null) return false;
  try {
    bridge.submitAssessment({
      ...payload,
      score: scaled,
      passingScore: normalizeAssessmentPassingScore({
        passingScore: payload.passingScore,
        maxScore: payload.maxScore,
      }),
    });
    return true;
  } catch (err) {
    handleBridgeError(err, opts?.onBridgeError);
    return false;
  }
}
