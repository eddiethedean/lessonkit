import { useCallback, useEffect, useRef } from "react";
import type { BlockId, CompoundResumeState, CourseId } from "@lessonkit/core";
import { loadCompoundState, saveCompoundState } from "@lessonkit/core";
import { createSessionStoragePort } from "@lessonkit/core";
import type { StoragePort } from "@lessonkit/core";
import { isDevEnvironment } from "../runtime/validateComponentId";

let warnedCompoundPersistFailure = false;

function warnCompoundPersistFailure(): void {
  if (warnedCompoundPersistFailure || !isDevEnvironment()) return;
  warnedCompoundPersistFailure = true;
  console.warn(
    "[lessonkit] compound resume state could not be saved to sessionStorage (quota or privacy mode); progress may be lost on reload.",
  );
}

export function useCompoundResume(opts: {
  courseId: CourseId | undefined;
  compoundId: BlockId;
  enabled: boolean;
  storage?: StoragePort;
  onResume?: (state: CompoundResumeState) => void;
}): (state: CompoundResumeState) => void {
  const storageRef = useRef(opts.storage ?? createSessionStoragePort());
  const resumedRef = useRef(false);
  const resumeKeyRef = useRef("");

  useEffect(() => {
    storageRef.current = opts.storage ?? createSessionStoragePort();
  }, [opts.storage]);

  useEffect(() => {
    const key = `${opts.courseId ?? ""}:${opts.compoundId}`;
    if (resumeKeyRef.current !== key) {
      resumeKeyRef.current = key;
      resumedRef.current = false;
    }
    if (!opts.enabled || !opts.courseId || resumedRef.current) return;
    const saved = loadCompoundState(storageRef.current, opts.courseId, opts.compoundId);
    if (saved) {
      resumedRef.current = true;
      opts.onResume?.(saved);
    }
  }, [opts.enabled, opts.courseId, opts.compoundId, opts.onResume]);

  return useCallback(
    (state: CompoundResumeState) => {
      if (!opts.enabled || !opts.courseId) return;
      const persisted = saveCompoundState(storageRef.current, opts.courseId, opts.compoundId, state);
      if (!persisted) warnCompoundPersistFailure();
    },
    [opts.enabled, opts.courseId, opts.compoundId],
  );
}
