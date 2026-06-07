import type { AssessmentResumeState } from "@lessonkit/core";
import { createCompoundResumeState } from "@lessonkit/core";

export const IV_META_KEY = "__lk_iv__";

export type InteractiveVideoMeta = {
  currentTime: number;
  completedCueIndices: number[];
  firedCueIndices: number[];
};

export function readInteractiveVideoMeta(
  childStates: Record<string, AssessmentResumeState>,
): InteractiveVideoMeta | null {
  const raw = childStates[IV_META_KEY];
  if (!raw || typeof raw !== "object") return null;
  const currentTime = typeof raw.currentTime === "number" ? raw.currentTime : 0;
  const completedCueIndices = Array.isArray(raw.completedCueIndices)
    ? (raw.completedCueIndices as number[]).filter((n) => typeof n === "number")
    : [];
  const firedCueIndices = Array.isArray(raw.firedCueIndices)
    ? (raw.firedCueIndices as number[]).filter((n) => typeof n === "number")
    : completedCueIndices;
  return { currentTime, completedCueIndices, firedCueIndices };
}

export function mergeVideoMetaIntoState(
  state: ReturnType<typeof createCompoundResumeState>,
  meta: InteractiveVideoMeta,
): ReturnType<typeof createCompoundResumeState> {
  return {
    ...state,
    childStates: {
      ...state.childStates,
      [IV_META_KEY]: meta as AssessmentResumeState,
    },
  };
}
