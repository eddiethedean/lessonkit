import React, { createContext, useCallback, useContext, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { AssessmentHandle, CheckId, CompoundHandle, CompoundResumeState } from "@lessonkit/core";
import { clampCompoundPageIndex, createCompoundResumeState } from "@lessonkit/core";
import { aggregateAssessmentScores } from "./aggregateScores";
import {
  CompoundHydrationBridgeProvider,
  useCompoundHydrationBridgeRef,
} from "./CompoundHydrationBridge";
import { useCompoundPageIndex } from "./CompoundPageIndexContext";
import { LessonkitContext } from "../context";
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
  const lessonkit = useContext(LessonkitContext);
  const onCompoundDuplicateCheckId =
    lessonkit?.config.observability?.onCompoundDuplicateCheckId;

  const register = useCallback((checkId: CheckId, handle: AssessmentHandle, pageIndex?: number) => {
    const prev = registryRef.current.get(checkId);
    if (prev && prev.handle !== handle) {
      const message = `[lessonkit] duplicate checkId "${checkId}" registered in the same compound container.`;
      onCompoundDuplicateCheckId?.({ checkId });
      throw new Error(message);
    }
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
  }, [onCompoundDuplicateCheckId]);

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
    <CompoundHydrationBridgeProvider>
      <CompoundRegistryContext.Provider value={registryValue}>
        <CompoundHandlesVersionContext.Provider value={handlesVersion}>
          {children}
        </CompoundHandlesVersionContext.Provider>
      </CompoundRegistryContext.Provider>
    </CompoundHydrationBridgeProvider>
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
  React.useLayoutEffect(() => {
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
  const bridgeRef = useCompoundHydrationBridgeRef();

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
        bridgeRef?.current?.notifyImperativeResume(state);
      },
    }),
    [activePageIndex, setIndexClamped, getHandles, getRegisteredHandles, opts.enableSolutionsButton, bridgeRef],
  );
}

/** @deprecated Use CompoundProvider — re-export for AssessmentSequence migration. */
export const AssessmentSequenceProvider = CompoundProvider;
export const useAssessmentSequenceRegistry = useCompoundRegistry;
