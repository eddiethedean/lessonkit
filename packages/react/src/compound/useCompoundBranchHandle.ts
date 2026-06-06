import { useCallback, useImperativeHandle } from "react";
import type React from "react";
import type { CompoundHandle, CompoundResumeState } from "@lessonkit/core";
import { createCompoundResumeState } from "@lessonkit/core";
import type { RegisteredAssessmentHandle } from "./CompoundProvider";
import { useCompoundHydrationBridgeRef } from "./CompoundHydrationBridge";
import { aggregateAssessmentScores } from "./aggregateScores";
import { sumChoiceScores } from "./useCompoundBranchShell";

export function useCompoundBranchHandle(
  ref: React.Ref<CompoundHandle>,
  opts: {
    activePageIndex: number;
    setActivePageIndex: (index: number) => void;
    getRegisteredHandles: () => Map<string, RegisteredAssessmentHandle>;
    pageCount?: number;
    visitedNodeIndices: ReadonlySet<number>;
    choiceScores: Record<string, number>;
    enableSolutionsButton?: boolean;
  },
) {
  const bridgeRef = useCompoundHydrationBridgeRef();
  const {
    activePageIndex,
    setActivePageIndex,
    getRegisteredHandles,
    pageCount,
    visitedNodeIndices,
    choiceScores,
    enableSolutionsButton,
  } = opts;

  const filterVisited = useCallback(
    (handles: Iterable<RegisteredAssessmentHandle>) => {
      const filtered: RegisteredAssessmentHandle[] = [];
      for (const entry of handles) {
        if (visitedNodeIndices.has(entry.pageIndex)) filtered.push(entry);
      }
      return filtered;
    },
    [visitedNodeIndices],
  );

  useImperativeHandle(
    ref,
    (): CompoundHandle => ({
      getScore: () => {
        const assessment = aggregateAssessmentScores(filterVisited(getRegisteredHandles().values()));
        return assessment.score + sumChoiceScores(choiceScores);
      },
      getMaxScore: () => {
        const assessment = aggregateAssessmentScores(filterVisited(getRegisteredHandles().values()));
        return assessment.maxScore + sumChoiceScores(choiceScores);
      },
      getAnswerGiven: () =>
        aggregateAssessmentScores(filterVisited(getRegisteredHandles().values()), {
          answerPageIndex: activePageIndex,
        }).allAnswered,
      resetTask: () => {
        for (const entry of filterVisited(getRegisteredHandles().values())) {
          entry.handle.resetTask();
        }
      },
      showSolutions: () => {
        if (!enableSolutionsButton) return;
        for (const entry of filterVisited(getRegisteredHandles().values())) {
          entry.handle.showSolutions();
        }
      },
      getCurrentState: () => {
        const childStates: Record<string, NonNullable<ReturnType<NonNullable<CompoundHandle["getCurrentState"]>>>> =
          {};
        for (const [checkId, entry] of getRegisteredHandles()) {
          if (!visitedNodeIndices.has(entry.pageIndex)) continue;
          if (entry.handle.getCurrentState) {
            childStates[checkId] = entry.handle.getCurrentState();
          }
        }
        return createCompoundResumeState({ activePageIndex, childStates });
      },
      resume: (state: CompoundResumeState) => {
        bridgeRef?.current?.notifyImperativeResume(state);
      },
    }),
    [
      activePageIndex,
      bridgeRef,
      choiceScores,
      enableSolutionsButton,
      filterVisited,
      getRegisteredHandles,
      pageCount,
      setActivePageIndex,
      visitedNodeIndices,
    ],
  );
}
