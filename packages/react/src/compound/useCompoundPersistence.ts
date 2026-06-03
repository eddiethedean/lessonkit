import React, { useCallback, useEffect, useRef } from "react";
import type { AssessmentResumeState, BlockId, CompoundResumeState, CourseId, StoragePort } from "@lessonkit/core";
import {
  clampCompoundPageIndex,
  createCompoundResumeState,
  createSessionStoragePort,
  loadCompoundState,
} from "@lessonkit/core";
import { useCompoundHandlesVersion, useCompoundRegistry } from "./CompoundProvider";
import { resumeChildHandles } from "./resumeChildHandles";
import { useCompoundResume } from "./useCompoundResume";

export function readCompoundInitialIndex(
  courseId: CourseId | undefined,
  compoundId: BlockId,
  pageCount: number,
  enabled: boolean,
  storage: StoragePort = createSessionStoragePort(),
): number {
  if (!enabled || !courseId || pageCount < 1) return 0;
  const saved = loadCompoundState(storage, courseId, compoundId);
  if (!saved) return 0;
  return clampCompoundPageIndex(saved.activePageIndex, pageCount);
}

export function useCompoundPersistence(opts: {
  courseId: CourseId | undefined;
  compoundId: BlockId;
  pageCount: number;
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  enabled: boolean;
  storage?: StoragePort;
}): void {
  const storage = opts.storage ?? createSessionStoragePort();
  const ctx = useCompoundRegistry();
  const handlesVersion = useCompoundHandlesVersion();
  const pendingChildResumeRef = useRef<CompoundResumeState | null>(null);
  /** Loaded child states merged into saves until live handles overwrite them. */
  const loadedChildStatesRef = useRef<Record<string, AssessmentResumeState>>({});
  const skipSaveUntilHydratedRef = useRef(false);

  const buildState = useCallback((): CompoundResumeState => {
    const childStates: Record<string, AssessmentResumeState> = {
      ...loadedChildStatesRef.current,
    };
    if (ctx) {
      for (const [checkId, handle] of ctx.getHandles()) {
        if (handle.getCurrentState) {
          childStates[checkId] = handle.getCurrentState();
          delete loadedChildStatesRef.current[checkId];
        }
      }
    }
    return createCompoundResumeState({
      activePageIndex: clampCompoundPageIndex(opts.index, opts.pageCount),
      childStates,
    });
  }, [ctx, opts.index, opts.pageCount]);

  const applyPendingChildResume = useCallback(() => {
    const pending = pendingChildResumeRef.current;
    if (!pending || !ctx) return;
    const applied = resumeChildHandles(ctx.getHandles(), pending.childStates, { waitForHandles: true });
    if (!applied) return;
    pendingChildResumeRef.current = null;
    skipSaveUntilHydratedRef.current = false;
  }, [ctx]);

  const saveResume = useCompoundResume({
    courseId: opts.courseId,
    compoundId: opts.compoundId,
    enabled: opts.enabled,
    storage,
    onResume: (state) => {
      const clamped = clampCompoundPageIndex(state.activePageIndex, opts.pageCount);
      loadedChildStatesRef.current = { ...state.childStates };
      skipSaveUntilHydratedRef.current = Object.keys(state.childStates).length > 0;
      opts.setIndex(clamped);
      pendingChildResumeRef.current = { ...state, activePageIndex: clamped };
      queueMicrotask(() => applyPendingChildResume());
    },
  });

  useEffect(() => {
    if (!opts.enabled || !opts.courseId) return;
    if (skipSaveUntilHydratedRef.current) return;
    saveResume(buildState());
  }, [
    opts.enabled,
    opts.courseId,
    opts.index,
    opts.pageCount,
    handlesVersion,
    saveResume,
    buildState,
  ]);

  useEffect(() => {
    applyPendingChildResume();
  }, [opts.index, handlesVersion, applyPendingChildResume]);
}
