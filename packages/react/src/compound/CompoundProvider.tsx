import React, { createContext, useCallback, useContext, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { AssessmentHandle, CheckId, CompoundHandle, CompoundResumeState } from "@lessonkit/core";
import { clampCompoundPageIndex, createCompoundResumeState } from "@lessonkit/core";
import { aggregateAssessmentScores } from "./aggregateScores";
import { useCompoundPageIndex } from "./CompoundPageIndexContext";
import { resumeChildHandles } from "./resumeChildHandles";

export type RegisteredAssessmentHandle = {
  handle: AssessmentHandle;
  pageIndex?: number;
};

type Registry = Map<CheckId, RegisteredAssessmentHandle>;

type CompoundRegistryContextValue = {
  register: (checkId: CheckId, handle: AssessmentHandle, pageIndex?: number) => () => void;
  getHandles: () => Map<CheckId, AssessmentHandle>;
  getRegisteredHandles: () => Registry;
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

  const register = useCallback((checkId: CheckId, handle: AssessmentHandle, pageIndex?: number) => {
    const prev = registryRef.current.get(checkId);
    registryRef.current.set(checkId, { handle, pageIndex });
    if (prev?.handle !== handle || prev?.pageIndex !== pageIndex) {
      setHandlesVersion((v) => v + 1);
    }
    return () => {
      const current = registryRef.current.get(checkId);
      if (current?.handle === handle) {
        registryRef.current.delete(checkId);
        setHandlesVersion((v) => v + 1);
      }
    };
  }, []);

  const registryValue = useMemo(
    () => ({
      register,
      getHandles: () => {
        const handles = new Map<CheckId, AssessmentHandle>();
        for (const [checkId, entry] of registryRef.current) {
          handles.set(checkId, entry.handle);
        }
        return handles;
      },
      getRegisteredHandles: () => registryRef.current,
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
  const pageIndex = useCompoundPageIndex();
  React.useEffect(() => {
    if (!registry || !handle) return;
    return registry.register(checkId, handle, pageIndex);
  }, [registry, checkId, handle, pageIndex]);
}

export function useCompoundHandleRef(
  ref: React.Ref<CompoundHandle>,
  opts: {
    activePageIndex: number;
    setActivePageIndex: (index: number) => void;
    getHandles: () => Map<CheckId, AssessmentHandle>;
    getRegisteredHandles: () => Registry;
    pageCount?: number;
    enableSolutionsButton?: boolean;
  },
) {
  const { activePageIndex, setActivePageIndex, getHandles, getRegisteredHandles, pageCount } = opts;

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
      getScore: () => aggregateAssessmentScores(getRegisteredHandles().values()).score,
      getMaxScore: () => aggregateAssessmentScores(getRegisteredHandles().values()).maxScore,
      getAnswerGiven: () =>
        aggregateAssessmentScores(getRegisteredHandles().values(), {
          answerPageIndex: activePageIndex,
        }).allAnswered,
      resetTask: () => {
        for (const entry of getRegisteredHandles().values()) entry.handle.resetTask();
      },
      showSolutions: () => {
        if (!opts.enableSolutionsButton) return;
        for (const entry of getRegisteredHandles().values()) entry.handle.showSolutions();
      },
      getCurrentState: () => {
        const childStates: Record<string, ReturnType<NonNullable<AssessmentHandle["getCurrentState"]>>> =
          {};
        for (const [checkId, entry] of getRegisteredHandles()) {
          if (entry.handle.getCurrentState) {
            childStates[checkId] = entry.handle.getCurrentState();
          }
        }
        return createCompoundResumeState({ activePageIndex, childStates });
      },
      resume: (state: CompoundResumeState) => {
        setIndexClamped(state.activePageIndex);
        resumeChildHandles(getHandles(), state.childStates, { waitForHandles: true });
      },
    }),
    [activePageIndex, setIndexClamped, getHandles, getRegisteredHandles, opts.enableSolutionsButton],
  );
}

/** @deprecated Use CompoundProvider — re-export for AssessmentSequence migration. */
export const AssessmentSequenceProvider = CompoundProvider;
export const useAssessmentSequenceRegistry = useCompoundRegistry;
