import type { CheckId, LessonId } from "@lessonkit/core";

export type LxpackBridgeV1 = {
  completeLesson?: (lessonId: LessonId) => void;
  completeCourse?: () => void;
  submitAssessment?: (payload: {
    id: string;
    score: number;
    passingScore?: number;
  }) => void;
  track?: (payload: { type: string; id: string; data?: Record<string, unknown> }) => void;
};

export type LxpackBridgeHost = {
  lxpackBridge?: { v1?: LxpackBridgeV1 };
  lxpack?: LxpackBridgeV1;
};

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
  const maxScore = typeof opts.maxScore === "number" && opts.maxScore > 0 ? opts.maxScore : 1;
  return opts.score / maxScore;
}

/** Bridge passing threshold (0–1 scale). Defaults to 1 when omitted or invalid. */
export function normalizeAssessmentPassingScore(passingScore?: number): number {
  return typeof passingScore === "number" && passingScore > 0 ? passingScore : 1;
}

function getBridge(): LxpackBridgeV1 | null {
  if (typeof window === "undefined") return null;
  const parent = window.parent as (Window & LxpackBridgeHost) | null;
  if (!parent || parent === window) return null;
  return parent.lxpackBridge?.v1 ?? parent.lxpack ?? null;
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
export function notifyLxpackAssessment(payload: {
  id: CheckId;
  score: number;
  passingScore?: number;
}): boolean {
  const bridge = getBridge();
  if (!bridge?.submitAssessment) return false;
  bridge.submitAssessment(payload);
  return true;
}
