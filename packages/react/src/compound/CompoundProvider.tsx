import React, { createContext, useCallback, useContext, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { AssessmentHandle, CheckId, CompoundHandle, CompoundResumeState } from "@lessonkit/core";
import { clampCompoundPageIndex, createCompoundResumeState } from "@lessonkit/core";
import { aggregateAssessmentScores } from "./aggregateScores";

type Registry = Map<CheckId, AssessmentHandle>;

type CompoundRegistryContextValue = {
  register: (checkId: CheckId, handle: AssessmentHandle) => () => void;
  getHandles: () => Registry;
};

const CompoundRegistryContext = createContext<CompoundRegistryContextValue | null>(null);
const CompoundHandlesVersionContext = createContext(0);

export function CompoundProvider({
  children,
  activePageIndex: _activePageIndex,
  onActivePageIndexChange: _onActivePageIndexChange,
}: {
  children: React.ReactNode;
  activePageIndex: number;
  onActivePageIndexChange: (index: number) => void;
}) {
  const registryRef = useRef<Registry>(new Map());
  const [handlesVersion, setHandlesVersion] = useState(0);

  const register = useCallback((checkId: CheckId, handle: AssessmentHandle) => {
    const prev = registryRef.current.get(checkId);
    registryRef.current.set(checkId, handle);
    if (prev !== handle) {
      setHandlesVersion((v) => v + 1);
    }
    return () => {
      if (registryRef.current.get(checkId) === handle) {
        registryRef.current.delete(checkId);
        setHandlesVersion((v) => v + 1);
      }
    };
  }, []);

  const registryValue = useMemo(
    () => ({
      register,
      getHandles: () => registryRef.current,
    }),
    [register],
  );

  return (
    <CompoundRegistryContext.Provider value={registryValue}>
      <CompoundHandlesVersionContext.Provider value={handlesVersion}>
        {children}
      </CompoundHandlesVersionContext.Provider>
    </CompoundRegistryContext.Provider>
  );
}

export function useCompoundRegistry() {
  const registry = useContext(CompoundRegistryContext);
  const handlesVersion = useContext(CompoundHandlesVersionContext);
  if (!registry) return null;
  return { ...registry, handlesVersion };
}

export function useCompoundHandlesVersion(): number {
  return useContext(CompoundHandlesVersionContext);
}

export function useRegisterAssessmentHandle(checkId: CheckId, handle: AssessmentHandle | null) {
  const registry = useContext(CompoundRegistryContext);
  React.useEffect(() => {
    if (!registry || !handle) return;
    return registry.register(checkId, handle);
  }, [registry, checkId, handle]);
}

export function useCompoundHandleRef(
  ref: React.Ref<CompoundHandle>,
  opts: {
    activePageIndex: number;
    setActivePageIndex: (index: number) => void;
    getHandles: () => Registry;
    pageCount?: number;
    enableSolutionsButton?: boolean;
  },
) {
  const { activePageIndex, setActivePageIndex, getHandles, pageCount } = opts;

  const setIndexClamped = useCallback(
    (index: number) => {
      const next =
        pageCount !== undefined ? clampCompoundPageIndex(index, pageCount) : Math.max(0, Math.floor(index));
      setActivePageIndex(next);
    },
    [pageCount, setActivePageIndex],
  );

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
        setIndexClamped(state.activePageIndex);
        for (const [checkId, handle] of getHandles()) {
          const child = state.childStates[checkId];
          if (child && handle.resume) handle.resume(child);
        }
      },
    }),
    [activePageIndex, setIndexClamped, getHandles, opts.enableSolutionsButton],
  );
}

/** @deprecated Use CompoundProvider — re-export for AssessmentSequence migration. */
export const AssessmentSequenceProvider = CompoundProvider;
export const useAssessmentSequenceRegistry = useCompoundRegistry;
