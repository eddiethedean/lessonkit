import React, { useCallback, useContext, useEffect, useRef } from "react";
import type { AssessmentResumeState, BlockId, CompoundResumeState, CourseId, StoragePort } from "@lessonkit/core";
import {
  clampCompoundPageIndex,
  createCompoundResumeState,
  createSessionStoragePort,
  loadCompoundState,
} from "@lessonkit/core";
import { useCompoundHydrationBridgeRef } from "./CompoundHydrationBridge";
import { useCompoundHandlesVersion, useCompoundRegistry } from "./CompoundProvider";
import { filterRegisteredChildStates, resumeChildHandles } from "./resumeChildHandles";
import { useCompoundResume } from "./useCompoundResume";
import { LessonkitContext } from "../context";

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

function stripOrphanChildStates(
  handles: Map<string, unknown>,
  childStates: Record<string, AssessmentResumeState>,
): Record<string, AssessmentResumeState> {
  return filterRegisteredChildStates(handles as Parameters<typeof filterRegisteredChildStates>[0], childStates);
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
  const lessonkitCtx = useContext(LessonkitContext);
  const storage = opts.storage ?? lessonkitCtx?.storage ?? createSessionStoragePort();
  const ctx = useCompoundRegistry();
  const handlesVersion = useCompoundHandlesVersion();
  const bridgeRef = useCompoundHydrationBridgeRef();
  const pendingChildResumeRef = useRef<CompoundResumeState | null>(null);
  const resumedChildKeysRef = useRef(new Set<string>());
  /** Loaded child states merged into saves until live handles overwrite them. */
  const loadedChildStatesRef = useRef<Record<string, AssessmentResumeState>>({});
  const skipSaveUntilHydratedRef = useRef(false);
  const hydrationKeyRef = useRef("");
  const hydrationInitRef = useRef(false);

  const hydrationKey = `${opts.courseId ?? ""}:${opts.compoundId}`;
  if (hydrationKeyRef.current !== hydrationKey) {
    hydrationKeyRef.current = hydrationKey;
    hydrationInitRef.current = false;
    loadedChildStatesRef.current = {};
    skipSaveUntilHydratedRef.current = false;
    pendingChildResumeRef.current = null;
    resumedChildKeysRef.current = new Set();
  }

  if (!hydrationInitRef.current && opts.enabled && opts.courseId) {
    hydrationInitRef.current = true;
    const saved = loadCompoundState(storage, opts.courseId, opts.compoundId);
    if (saved && Object.keys(saved.childStates).length > 0) {
      loadedChildStatesRef.current = { ...saved.childStates };
      skipSaveUntilHydratedRef.current = true;
      pendingChildResumeRef.current = saved;
    }
  }

  const buildState = useCallback((): CompoundResumeState => {
    const childStates: Record<string, AssessmentResumeState> = {
      ...loadedChildStatesRef.current,
    };
    if (ctx) {
      for (const [checkId, entry] of ctx.getRegisteredHandles()) {
        const handle = entry.handle;
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

  const buildStateRef = useRef(buildState);
  buildStateRef.current = buildState;

  const finalizeHydration = useCallback(
    (childStates: Record<string, AssessmentResumeState>) => {
      loadedChildStatesRef.current = {
        ...loadedChildStatesRef.current,
        ...childStates,
      };
      skipSaveUntilHydratedRef.current = false;
      pendingChildResumeRef.current = null;
    },
    [],
  );

  const applyPendingChildResume = useCallback(() => {
    const pending = pendingChildResumeRef.current;
    if (!pending || !ctx) return;
    const handles = ctx.getHandles();
    const applied = resumeChildHandles(handles, pending.childStates, {
      waitForHandles: true,
      alreadyResumed: resumedChildKeysRef.current,
    });
    if (!applied) {
      const handlesAtWait = handles.size;
      queueMicrotask(() => {
        if (pendingChildResumeRef.current !== pending) return;
        const handlesNow = ctx.getHandles();
        if (handlesNow.size !== handlesAtWait) return;
        const registeredOnly = stripOrphanChildStates(handlesNow, pending.childStates);
        resumeChildHandles(handlesNow, registeredOnly, {
          alreadyResumed: resumedChildKeysRef.current,
        });
        finalizeHydration(registeredOnly);
      });
      return;
    }
    const registeredOnly = stripOrphanChildStates(handles, pending.childStates);
    finalizeHydration(registeredOnly);
  }, [ctx, finalizeHydration]);

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
      resumedChildKeysRef.current = new Set();
      pendingChildResumeRef.current = { ...state, activePageIndex: clamped, childStates: state.childStates };
      queueMicrotask(() => applyPendingChildResume());
    },
  });

  const persistNow = useCallback(() => {
    if (!opts.enabled || !opts.courseId) return;
    saveResume(buildStateRef.current());
  }, [opts.enabled, opts.courseId, saveResume]);

  const notifyImperativeResume = useCallback(
    (state: CompoundResumeState) => {
      const clamped = clampCompoundPageIndex(state.activePageIndex, opts.pageCount);
      loadedChildStatesRef.current = { ...state.childStates };
      skipSaveUntilHydratedRef.current = Object.keys(state.childStates).length > 0;
      opts.setIndex(clamped);
      resumedChildKeysRef.current = new Set();
      pendingChildResumeRef.current = { ...state, activePageIndex: clamped, childStates: state.childStates };
      queueMicrotask(() => applyPendingChildResume());
    },
    [opts.pageCount, opts.setIndex, applyPendingChildResume],
  );

  useEffect(() => {
    if (!bridgeRef) return;
    bridgeRef.current = { notifyImperativeResume };
    return () => {
      if (bridgeRef.current?.notifyImperativeResume === notifyImperativeResume) {
        bridgeRef.current = null;
      }
    };
  }, [bridgeRef, notifyImperativeResume]);

  useEffect(() => {
    persistNow();
  }, [persistNow, opts.index, opts.pageCount, handlesVersion]);

  useEffect(() => {
    applyPendingChildResume();
  }, [opts.index, handlesVersion, applyPendingChildResume]);

  useEffect(() => {
    if (!opts.enabled || !opts.courseId || typeof document === "undefined") return;
    const flushOnExit = () => {
      if (document.visibilityState === "hidden") persistNow();
    };
    document.addEventListener("visibilitychange", flushOnExit);
    window.addEventListener("pagehide", flushOnExit);
    return () => {
      document.removeEventListener("visibilitychange", flushOnExit);
      window.removeEventListener("pagehide", flushOnExit);
    };
  }, [opts.enabled, opts.courseId, persistNow]);
}
