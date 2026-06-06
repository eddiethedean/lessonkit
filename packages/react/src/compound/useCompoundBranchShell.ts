import type { AssessmentResumeState } from "@lessonkit/core";
import { createCompoundResumeState } from "@lessonkit/core";

export const BS_META_KEY = "__lk_bs__";

export type BranchingScenarioMeta = {
  activeNodeId: string;
  visitedNodeIds: string[];
  choiceScores?: Record<string, number>;
};

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

export function sumChoiceScores(choiceScores: Record<string, number> | undefined): number {
  if (!choiceScores) return 0;
  return Object.values(choiceScores).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}
