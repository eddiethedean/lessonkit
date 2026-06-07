import { useCallback, useContext, useEffect, useRef } from "react";
import type { BlockId, CompoundResumeState, CourseId } from "@lessonkit/core";
import { loadCompoundState, saveCompoundState } from "@lessonkit/core";
import { createSessionStoragePort } from "@lessonkit/core";
import type { StoragePort } from "@lessonkit/core";
import { isCompoundHydrated } from "./compoundHydration";
import { isDevEnvironment } from "../runtime/validateComponentId";
import { LessonkitContext } from "../context";
import { compoundLoadOpts } from "./compoundLoadOpts";

const warnedCompoundPersistFailures = new Set<string>();

function warnCompoundPersistFailure(compoundId: BlockId): void {
  if (warnedCompoundPersistFailures.has(compoundId) || !isDevEnvironment()) return;
  warnedCompoundPersistFailures.add(compoundId);
  console.warn(
    `[lessonkit] compound resume state for "${compoundId}" could not be saved to sessionStorage (quota or privacy mode); progress may be lost on reload.`,
  );
}

/** Test-only reset. */
export function resetCompoundPersistFailureWarnings(): void {
  warnedCompoundPersistFailures.clear();
}

export function useCompoundResume(opts: {
  courseId: CourseId | undefined;
  compoundId: BlockId;
  enabled: boolean;
  storage?: StoragePort;
  onResume?: (state: CompoundResumeState) => void;
}): (state: CompoundResumeState) => void {
  const lessonkitCtx = useContext(LessonkitContext);
  const storageRef = useRef(opts.storage ?? lessonkitCtx?.storage ?? createSessionStoragePort());
  const resumedRef = useRef(false);
  const resumeKeyRef = useRef("");
  const prevEnabledRef = useRef(opts.enabled);

  useEffect(() => {
    storageRef.current = opts.storage ?? lessonkitCtx?.storage ?? createSessionStoragePort();
  }, [opts.storage, lessonkitCtx?.storage]);

  useEffect(() => {
    if (!prevEnabledRef.current && opts.enabled) {
      resumedRef.current = false;
    }
    prevEnabledRef.current = opts.enabled;

    const key = `${opts.courseId ?? ""}:${opts.compoundId}`;
    if (resumeKeyRef.current !== key) {
      resumeKeyRef.current = key;
      resumedRef.current = false;
    }
    if (!opts.enabled || !opts.courseId || resumedRef.current) return;
    if (isCompoundHydrated(key)) {
      resumedRef.current = true;
      return;
    }
    const saved = loadCompoundState(
      storageRef.current,
      opts.courseId,
      opts.compoundId,
      compoundLoadOpts(lessonkitCtx, opts.compoundId),
    );
    if (saved) {
      resumedRef.current = true;
      opts.onResume?.(saved);
    }
  }, [opts.enabled, opts.courseId, opts.compoundId, opts.onResume]);

  return useCallback(
    (state: CompoundResumeState) => {
      if (!opts.enabled || !opts.courseId) return;
      const persisted = saveCompoundState(storageRef.current, opts.courseId, opts.compoundId, state);
      if (!persisted) warnCompoundPersistFailure(opts.compoundId);
    },
    [opts.enabled, opts.courseId, opts.compoundId],
  );
}
