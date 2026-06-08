import type { AssessmentResumeState } from "@lessonkit/core";
import { createCompoundResumeState } from "@lessonkit/core";

export const GM_META_KEY = "__lk_gm__";

export type GameMapMeta = {
  activeStageId: string;
  visitedStageIds: string[];
  exitScores?: Record<string, number>;
};

export function createInitialMapMeta(startStageId: string): GameMapMeta {
  return { activeStageId: startStageId, visitedStageIds: [startStageId] };
}

export function readGameMapMeta(childStates: Record<string, AssessmentResumeState>): GameMapMeta | null {
  const raw = childStates[GM_META_KEY];
  if (!raw || typeof raw !== "object") return null;
  const activeStageId = typeof raw.activeStageId === "string" ? raw.activeStageId : "";
  const visitedStageIds = Array.isArray(raw.visitedStageIds)
    ? (raw.visitedStageIds as string[]).filter((id) => typeof id === "string")
    : [];
  const exitScores =
    raw.exitScores && typeof raw.exitScores === "object" && !Array.isArray(raw.exitScores)
      ? (raw.exitScores as Record<string, number>)
      : undefined;
  if (!activeStageId) return null;
  return { activeStageId, visitedStageIds, exitScores };
}

export function sanitizeMapMeta(
  meta: GameMapMeta,
  stageIndexMap: ReadonlyMap<string, number>,
  startStageId: string,
): GameMapMeta {
  const knownIds = new Set(stageIndexMap.keys());
  const activeStageId = knownIds.has(meta.activeStageId) ? meta.activeStageId : startStageId;
  const visitedStageIds = meta.visitedStageIds.filter((id) => knownIds.has(id));
  if (!visitedStageIds.includes(activeStageId)) {
    visitedStageIds.push(activeStageId);
  }
  if (visitedStageIds.length === 0) {
    visitedStageIds.push(startStageId);
  }
  return {
    activeStageId,
    visitedStageIds,
    ...(meta.exitScores && Object.keys(meta.exitScores).length > 0 ? { exitScores: meta.exitScores } : {}),
  };
}

export function mergeMapMetaIntoState(
  state: ReturnType<typeof createCompoundResumeState>,
  meta: GameMapMeta,
): ReturnType<typeof createCompoundResumeState> {
  return {
    ...state,
    childStates: {
      ...state.childStates,
      [GM_META_KEY]: meta as AssessmentResumeState,
    },
  };
}

export function exitScoreKey(fromStageId: string, toStageId: string): string {
  return `${fromStageId}:${toStageId}`;
}

export function applyExitScoreUpdate(
  prev: Record<string, number> | undefined,
  fromStageId: string,
  toStageId: string,
  scoreWeight?: number,
): Record<string, number> | undefined {
  if (scoreWeight === undefined) return prev;
  const next = { ...(prev ?? {}) };
  for (const key of Object.keys(next)) {
    if (key.startsWith(`${fromStageId}:`)) {
      delete next[key];
    }
  }
  next[exitScoreKey(fromStageId, toStageId)] = scoreWeight;
  return next;
}

export function sumExitScores(exitScores: Record<string, number> | undefined): number {
  if (!exitScores) return 0;
  return Object.values(exitScores).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}
