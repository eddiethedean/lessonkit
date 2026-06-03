import React, { createContext, useCallback, useContext, useMemo, useRef } from "react";
import type { AssessmentHandle } from "@lessonkit/core";
import type { CheckId } from "@lessonkit/core";

type Registry = Map<CheckId, AssessmentHandle>;

const AssessmentSequenceContext = createContext<{
  register: (checkId: CheckId, handle: AssessmentHandle) => () => void;
  getHandles: () => Registry;
} | null>(null);

export function AssessmentSequenceProvider({ children }: { children: React.ReactNode }) {
  const registryRef = useRef<Registry>(new Map());

  const register = useCallback((checkId: CheckId, handle: AssessmentHandle) => {
    registryRef.current.set(checkId, handle);
    return () => {
      registryRef.current.delete(checkId);
    };
  }, []);

  const value = useMemo(
    () => ({
      register,
      getHandles: () => registryRef.current,
    }),
    [register],
  );

  return (
    <AssessmentSequenceContext.Provider value={value}>{children}</AssessmentSequenceContext.Provider>
  );
}

export function useAssessmentSequenceRegistry() {
  return useContext(AssessmentSequenceContext);
}

export function useRegisterAssessmentHandle(checkId: CheckId, handle: AssessmentHandle | null) {
  const ctx = useAssessmentSequenceRegistry();
  React.useEffect(() => {
    if (!ctx || !handle) return;
    return ctx.register(checkId, handle);
  }, [ctx, checkId, handle]);
}
