import React, { useCallback, useEffect, useRef } from "react";
import type { AssessmentResumeState, BlockId, CompoundResumeState, CourseId } from "@lessonkit/core";
import {
  createCompoundResumeState,
  createSessionStoragePort,
  loadCompoundState,
} from "@lessonkit/core";
import { useCompoundRegistry } from "./CompoundProvider";
import { useCompoundResume } from "./useCompoundResume";

export function readCompoundInitialIndex(
  courseId: CourseId | undefined,
  compoundId: BlockId,
  pageCount: number,
  enabled: boolean,
): number {
  if (!enabled || !courseId || pageCount < 1) return 0;
  const saved = loadCompoundState(createSessionStoragePort(), courseId, compoundId);
  if (!saved) return 0;
  return Math.min(saved.activePageIndex, pageCount - 1);
}

export function useCompoundPersistence(opts: {
  courseId: CourseId | undefined;
  compoundId: BlockId;
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  enabled: boolean;
}): void {
  const ctx = useCompoundRegistry();
  const pendingChildResumeRef = useRef<CompoundResumeState | null>(null);

  const buildState = useCallback((): CompoundResumeState => {
    const childStates: Record<string, AssessmentResumeState> = {};
    if (ctx) {
      for (const [checkId, handle] of ctx.getHandles()) {
        if (handle.getCurrentState) {
          childStates[checkId] = handle.getCurrentState();
        }
      }
    }
    return createCompoundResumeState({ activePageIndex: opts.index, childStates });
  }, [ctx, opts.index]);

  const applyPendingChildResume = useCallback(() => {
    const pending = pendingChildResumeRef.current;
    if (!pending || !ctx) return;
    const handles = ctx.getHandles();
    if (handles.size === 0) return;
    for (const [checkId, handle] of handles) {
      const child = pending.childStates[checkId];
      if (child && handle.resume) handle.resume(child);
    }
    pendingChildResumeRef.current = null;
  }, [ctx]);

  const saveResume = useCompoundResume({
    courseId: opts.courseId,
    compoundId: opts.compoundId,
    enabled: opts.enabled,
    onResume: (state) => {
      opts.setIndex(state.activePageIndex);
      pendingChildResumeRef.current = state;
      queueMicrotask(() => applyPendingChildResume());
    },
  });

  useEffect(() => {
    if (!opts.enabled || !opts.courseId) return;
    saveResume(buildState());
  }, [opts.enabled, opts.courseId, opts.index, saveResume, buildState]);

  useEffect(() => {
    applyPendingChildResume();
  }, [opts.index, applyPendingChildResume]);
}
