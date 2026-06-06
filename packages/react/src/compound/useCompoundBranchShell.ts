import type { AssessmentResumeState } from "@lessonkit/core";
import { createCompoundResumeState } from "@lessonkit/core";

export const BS_META_KEY = "__lk_bs__";

export type BranchingScenarioMeta = {
  activeNodeId: string;
  visitedNodeIds: string[];
  choiceScores?: Record<string, number>;
};

export function createInitialBranchMeta(startNodeId: string): BranchingScenarioMeta {
  return { activeNodeId: startNodeId, visitedNodeIds: [startNodeId] };
}

export function readBranchingScenarioMeta(
  childStates: Record<string, AssessmentResumeState>,
): BranchingScenarioMeta | null {
  const raw = childStates[BS_META_KEY];
  if (!raw || typeof raw !== "object") return null;
  const activeNodeId = typeof raw.activeNodeId === "string" ? raw.activeNodeId : "";
  const visitedNodeIds = Array.isArray(raw.visitedNodeIds)
    ? (raw.visitedNodeIds as string[]).filter((id) => typeof id === "string")
    : [];
  const choiceScores =
    raw.choiceScores && typeof raw.choiceScores === "object" && !Array.isArray(raw.choiceScores)
      ? (raw.choiceScores as Record<string, number>)
      : undefined;
  if (!activeNodeId) return null;
  return { activeNodeId, visitedNodeIds, choiceScores };
}

/** Clamp branch meta to known node ids; reset to start when active node is invalid. */
export function sanitizeBranchMeta(
  meta: BranchingScenarioMeta,
  nodeIndexMap: ReadonlyMap<string, number>,
  startNodeId: string,
): BranchingScenarioMeta {
  const knownIds = new Set(nodeIndexMap.keys());
  const activeNodeId = knownIds.has(meta.activeNodeId) ? meta.activeNodeId : startNodeId;
  const visitedNodeIds = meta.visitedNodeIds.filter((id) => knownIds.has(id));
  if (!visitedNodeIds.includes(activeNodeId)) {
    visitedNodeIds.push(activeNodeId);
  }
  if (visitedNodeIds.length === 0) {
    visitedNodeIds.push(startNodeId);
  }
  const choiceScores = meta.choiceScores
    ? Object.fromEntries(
        Object.entries(meta.choiceScores).filter(([key]) => {
          const fromId = key.split(":")[0];
          return fromId !== undefined && knownIds.has(fromId);
        }),
      )
    : undefined;
  return {
    activeNodeId,
    visitedNodeIds,
    ...(Object.keys(choiceScores ?? {}).length > 0 ? { choiceScores } : {}),
  };
}

export function mergeBranchMetaIntoState(
  state: ReturnType<typeof createCompoundResumeState>,
  meta: BranchingScenarioMeta,
): ReturnType<typeof createCompoundResumeState> {
  return {
    ...state,
    childStates: {
      ...state.childStates,
      [BS_META_KEY]: meta as AssessmentResumeState,
    },
  };
}

export function choiceScoreKey(fromNodeId: string, toNodeId: string): string {
  return `${fromNodeId}:${toNodeId}`;
}

/** Replace prior choice from the same node (cycle-safe). */
export function applyChoiceScoreUpdate(
  prev: Record<string, number> | undefined,
  fromNodeId: string,
  toNodeId: string,
  scoreWeight?: number,
): Record<string, number> | undefined {
  if (scoreWeight === undefined) return prev;
  const next = { ...(prev ?? {}) };
  for (const key of Object.keys(next)) {
    if (key.startsWith(`${fromNodeId}:`)) {
      delete next[key];
    }
  }
  next[choiceScoreKey(fromNodeId, toNodeId)] = scoreWeight;
  return next;
}

export function sumChoiceScores(choiceScores: Record<string, number> | undefined): number {
  if (!choiceScores) return 0;
  return Object.values(choiceScores).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}
