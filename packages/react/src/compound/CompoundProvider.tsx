import React, { createContext, useCallback, useContext, useImperativeHandle, useMemo, useRef } from "react";
import type { AssessmentHandle, CheckId, CompoundHandle, CompoundResumeState } from "@lessonkit/core";
import { createCompoundResumeState } from "@lessonkit/core";
import { aggregateAssessmentScores } from "./aggregateScores";

type Registry = Map<CheckId, AssessmentHandle>;

type CompoundContextValue = {
  register: (checkId: CheckId, handle: AssessmentHandle) => () => void;
  getHandles: () => Registry;
  activePageIndex: number;
  setActivePageIndex: (index: number) => void;
};

const CompoundContext = createContext<CompoundContextValue | null>(null);

export function CompoundProvider({
  children,
  activePageIndex,
  onActivePageIndexChange,
}: {
  children: React.ReactNode;
  activePageIndex: number;
  onActivePageIndexChange: (index: number) => void;
}) {
  const registryRef = useRef<Registry>(new Map());

  const register = useCallback((checkId: CheckId, handle: AssessmentHandle) => {
    registryRef.current.set(checkId, handle);
    return () => {
      registryRef.current.delete(checkId);
    };
  }, []);

  const setActivePageIndex = useCallback(
    (index: number) => {
      onActivePageIndexChange(index);
    },
    [onActivePageIndexChange],
  );

  const value = useMemo(
    () => ({
      register,
      getHandles: () => registryRef.current,
      activePageIndex,
      setActivePageIndex,
    }),
    [register, activePageIndex, setActivePageIndex],
  );

  return <CompoundContext.Provider value={value}>{children}</CompoundContext.Provider>;
}

export function useCompoundRegistry() {
  return useContext(CompoundContext);
}

export function useRegisterAssessmentHandle(checkId: CheckId, handle: AssessmentHandle | null) {
  const ctx = useCompoundRegistry();
  React.useEffect(() => {
    if (!ctx || !handle) return;
    return ctx.register(checkId, handle);
  }, [ctx, checkId, handle]);
}

export function useCompoundHandleRef(
  ref: React.Ref<CompoundHandle>,
  opts: {
    activePageIndex: number;
    setActivePageIndex: (index: number) => void;
    getHandles: () => Registry;
    enableSolutionsButton?: boolean;
  },
) {
  const { activePageIndex, setActivePageIndex, getHandles } = opts;

  useImperativeHandle(
    ref,
    (): CompoundHandle => ({
      getScore: () => aggregateAssessmentScores(getHandles().values()).score,
      getMaxScore: () => aggregateAssessmentScores(getHandles().values()).maxScore,
      getAnswerGiven: () => aggregateAssessmentScores(getHandles().values()).allAnswered,
      resetTask: () => {
        for (const handle of getHandles().values()) handle.resetTask();
      },
      showSolutions: () => {
        if (!opts.enableSolutionsButton) return;
        for (const handle of getHandles().values()) handle.showSolutions();
      },
      getCurrentState: () => {
        const childStates: Record<string, ReturnType<NonNullable<AssessmentHandle["getCurrentState"]>>> =
          {};
        for (const [checkId, handle] of getHandles()) {
          if (handle.getCurrentState) {
            childStates[checkId] = handle.getCurrentState();
          }
        }
        return createCompoundResumeState({ activePageIndex, childStates });
      },
      resume: (state: CompoundResumeState) => {
        setActivePageIndex(state.activePageIndex);
        for (const [checkId, handle] of getHandles()) {
          const child = state.childStates[checkId];
          if (child && handle.resume) handle.resume(child);
        }
      },
    }),
    [activePageIndex, setActivePageIndex, getHandles, opts.enableSolutionsButton],
  );
}

/** @deprecated Use CompoundProvider — re-export for AssessmentSequence migration. */
export const AssessmentSequenceProvider = CompoundProvider;
export const useAssessmentSequenceRegistry = useCompoundRegistry;
