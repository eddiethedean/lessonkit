import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef } from "react";
import type { AssessmentResumeState, BlockId, CheckId, CompoundResumeState, CourseId, StoragePort } from "@lessonkit/core";
import {
  clampCompoundPageIndex,
  createCompoundResumeState,
  createSessionStoragePort,
  loadCompoundState,
} from "@lessonkit/core";
import { useCompoundHydrationBridgeRef } from "./CompoundHydrationBridge";
import { useCompoundHandlesVersion, useCompoundRegistry } from "./CompoundProvider";
import {
  clearCompoundHydrated,
  compoundHydrationKey,
  markCompoundHydrated,
} from "./compoundHydration";
import { filterRegisteredChildStates, registerablePendingKeys, resumeChildHandles } from "./resumeChildHandles";
import { useCompoundResume } from "./useCompoundResume";
import { LessonkitContext } from "../context";
import { isDevEnvironment } from "../runtime/validateComponentId";

const MAX_HYDRATION_RETRIES = 10;

function isEmptyResumeState(state: AssessmentResumeState): boolean {
  if (!state || typeof state !== "object") return true;
  return Object.keys(state).length === 0;
}

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
  /** Merges extra resume fields (e.g. InteractiveVideo timeline meta) before save. */
  transformState?: (state: CompoundResumeState) => CompoundResumeState;
  /** Called when compound state is restored from storage or imperative resume. */
  onCompoundResume?: (state: CompoundResumeState) => void;
  /** When set, only registered handles passing this filter are written to childStates on save. */
  shouldIncludeChildState?: (checkId: CheckId, pageIndex: number | undefined) => boolean;
  /** Bumped externally (e.g. InteractiveVideo timeupdate) to trigger a persist without index change. */
  persistTrigger?: number;
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
  const postResumePersistPendingRef = useRef(false);
  const hydrationKeyRef = useRef("");
  const hydrationRetryRef = useRef(0);

  const hydrationKey = `${opts.courseId ?? ""}:${opts.compoundId}`;
  if (hydrationKeyRef.current !== hydrationKey) {
    if (hydrationKeyRef.current) {
      clearCompoundHydrated(hydrationKeyRef.current);
    }
    hydrationKeyRef.current = hydrationKey;
    loadedChildStatesRef.current = {};
    skipSaveUntilHydratedRef.current = false;
    postResumePersistPendingRef.current = false;
    pendingChildResumeRef.current = null;
    resumedChildKeysRef.current = new Set();
    hydrationRetryRef.current = 0;
  }

  const buildState = useCallback((): CompoundResumeState => {
    const childStates: Record<string, AssessmentResumeState> = {
      ...loadedChildStatesRef.current,
    };
    if (ctx) {
      for (const [checkId, entry] of ctx.getRegisteredHandles()) {
        if (opts.shouldIncludeChildState && !opts.shouldIncludeChildState(checkId, entry.pageIndex)) {
          continue;
        }
        const handle = entry.handle;
        if (handle.getCurrentState) {
          const live = handle.getCurrentState();
          const loaded = loadedChildStatesRef.current[checkId];
          if (loaded !== undefined && isEmptyResumeState(live)) {
            childStates[checkId] = loaded;
          } else {
            childStates[checkId] = live;
            if (!isEmptyResumeState(live)) {
              delete loadedChildStatesRef.current[checkId];
            }
          }
        }
      }
    }
    return createCompoundResumeState({
      activePageIndex: clampCompoundPageIndex(opts.index, opts.pageCount),
      childStates,
    });
  }, [ctx, opts.index, opts.pageCount, opts.shouldIncludeChildState]);

  const buildStateRef = useRef(buildState);
  buildStateRef.current = buildState;
  const transformStateRef = useRef(opts.transformState);
  transformStateRef.current = opts.transformState;
  const onCompoundResumeRef = useRef(opts.onCompoundResume);
  onCompoundResumeRef.current = opts.onCompoundResume;
  const persistNowRef = useRef<() => void>(() => {});

  const finalizeHydration = useCallback(
    (childStates: Record<string, AssessmentResumeState>) => {
      loadedChildStatesRef.current = {
        ...loadedChildStatesRef.current,
        ...childStates,
      };
      skipSaveUntilHydratedRef.current = false;
      pendingChildResumeRef.current = null;
      hydrationRetryRef.current = 0;
      postResumePersistPendingRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          postResumePersistPendingRef.current = false;
          persistNowRef.current();
        });
      });
    },
    [],
  );

  const applyPendingChildResumeRef = useRef<() => void>(() => {});

  const applyPendingChildResume = useCallback(() => {
    const pending = pendingChildResumeRef.current;
    if (!pending || !ctx) return;
    const handles = ctx.getHandles();
    const applied = resumeChildHandles(handles, pending.childStates, {
      waitForHandles: true,
      alreadyResumed: resumedChildKeysRef.current,
    });
    if (!applied) {
      const registerable = registerablePendingKeys(pending.childStates);
      const missing = registerable.filter((k) => !handles.has(k as CheckId));
      if (missing.length > 0 && hydrationRetryRef.current < MAX_HYDRATION_RETRIES) {
        hydrationRetryRef.current += 1;
        requestAnimationFrame(() => applyPendingChildResumeRef.current());
        return;
      }
      if (missing.length > 0 && isDevEnvironment()) {
        console.warn(
          `[lessonkit] Compound hydration: ${missing.length} child state(s) not restored (missing handles: ${missing.join(", ")})`,
        );
      }
      lessonkitCtx?.config?.observability?.onCompoundHydrationPartial?.({
        compoundId: opts.compoundId,
        missingCheckIds: missing,
      });
      for (const key of missing) {
        const state = pending.childStates[key];
        if (state) {
          loadedChildStatesRef.current[key] = state;
        }
      }
      const registeredOnly = stripOrphanChildStates(handles, pending.childStates);
      resumeChildHandles(handles, registeredOnly, {
        alreadyResumed: resumedChildKeysRef.current,
      });
      finalizeHydration({
        ...loadedChildStatesRef.current,
        ...registeredOnly,
      });
      return;
    }
    const registeredOnly = stripOrphanChildStates(handles, pending.childStates);
    finalizeHydration(registeredOnly);
  }, [ctx, finalizeHydration]);

  applyPendingChildResumeRef.current = applyPendingChildResume;

  useLayoutEffect(() => {
    if (!opts.enabled || !opts.courseId) return;
    markCompoundHydrated(compoundHydrationKey(opts.courseId, opts.compoundId));
    const saved = loadCompoundState(storage, opts.courseId, opts.compoundId);
    if (!saved) return;
    if (Object.keys(saved.childStates).length > 0) {
      loadedChildStatesRef.current = { ...saved.childStates };
      skipSaveUntilHydratedRef.current = true;
      pendingChildResumeRef.current = saved;
    }
    const clamped = clampCompoundPageIndex(saved.activePageIndex, opts.pageCount);
    onCompoundResumeRef.current?.({ ...saved, activePageIndex: clamped });
    opts.setIndex(clamped);
    queueMicrotask(() => applyPendingChildResumeRef.current());
  }, [hydrationKey, opts.courseId, opts.compoundId, opts.enabled, opts.pageCount, storage]);

  const saveResume = useCompoundResume({
    courseId: opts.courseId,
    compoundId: opts.compoundId,
    enabled: opts.enabled,
    storage,
    onResume: (state) => {
      const clamped = clampCompoundPageIndex(state.activePageIndex, opts.pageCount);
      loadedChildStatesRef.current = { ...state.childStates };
      skipSaveUntilHydratedRef.current = Object.keys(state.childStates).length > 0;
      onCompoundResumeRef.current?.({ ...state, activePageIndex: clamped });
      opts.setIndex(clamped);
      resumedChildKeysRef.current = new Set();
      hydrationRetryRef.current = 0;
      pendingChildResumeRef.current = { ...state, activePageIndex: clamped, childStates: state.childStates };
      queueMicrotask(() => applyPendingChildResume());
    },
  });

  const buildBestEffortState = useCallback((): CompoundResumeState => {
    const childStates: Record<string, AssessmentResumeState> = {
      ...loadedChildStatesRef.current,
    };
    if (ctx) {
      for (const [checkId, entry] of ctx.getRegisteredHandles()) {
        if (opts.shouldIncludeChildState && !opts.shouldIncludeChildState(checkId, entry.pageIndex)) {
          continue;
        }
        const handle = entry.handle;
        if (handle.getCurrentState) {
          const live = handle.getCurrentState();
          if (!isEmptyResumeState(live)) {
            childStates[checkId] = live;
          }
        }
      }
    }
    const built = createCompoundResumeState({
      activePageIndex: clampCompoundPageIndex(opts.index, opts.pageCount),
      childStates,
    });
    return transformStateRef.current ? transformStateRef.current(built) : built;
  }, [ctx, opts.index, opts.pageCount, opts.shouldIncludeChildState]);

  const persistNow = useCallback(
    (options?: { forceDuringHydration?: boolean }) => {
      if (!opts.enabled || !opts.courseId) return;
      if (options?.forceDuringHydration) {
        saveResume(buildBestEffortState());
        return;
      }
      if (skipSaveUntilHydratedRef.current) return;
      if (postResumePersistPendingRef.current) return;
      const built = buildStateRef.current();
      const state = transformStateRef.current ? transformStateRef.current(built) : built;
      saveResume(state);
    },
    [opts.enabled, opts.courseId, saveResume, buildBestEffortState],
  );

  useEffect(() => {
    persistNowRef.current = persistNow;
  }, [persistNow]);

  const notifyImperativeResume = useCallback(
    (state: CompoundResumeState) => {
      const clamped = clampCompoundPageIndex(state.activePageIndex, opts.pageCount);
      loadedChildStatesRef.current = { ...state.childStates };
      skipSaveUntilHydratedRef.current = Object.keys(state.childStates).length > 0;
      onCompoundResumeRef.current?.({ ...state, activePageIndex: clamped });
      opts.setIndex(clamped);
      resumedChildKeysRef.current = new Set();
      hydrationRetryRef.current = 0;
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
    applyPendingChildResume();
  }, [opts.index, handlesVersion, applyPendingChildResume]);

  useEffect(() => {
    persistNow();
  }, [persistNow, opts.index, opts.pageCount, handlesVersion, opts.persistTrigger]);

  useEffect(() => {
    if (!opts.enabled || !opts.courseId || typeof document === "undefined") return;
    const flushOnExit = () => {
      if (document.visibilityState === "hidden") {
        persistNow({ forceDuringHydration: skipSaveUntilHydratedRef.current });
      }
    };
    document.addEventListener("visibilitychange", flushOnExit);
    const flushOnPageHide = () => {
      persistNow({ forceDuringHydration: skipSaveUntilHydratedRef.current });
    };
    window.addEventListener("pagehide", flushOnPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flushOnExit);
      window.removeEventListener("pagehide", flushOnPageHide);
    };
  }, [opts.enabled, opts.courseId, persistNow]);
}
