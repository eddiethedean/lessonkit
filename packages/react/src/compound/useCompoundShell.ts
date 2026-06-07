import type React from "react";
import { useMemo } from "react";
import type { BlockId, CompoundHandle, CompoundResumeState, CourseId } from "@lessonkit/core";
import { clampCompoundPageIndex, type StoragePort } from "@lessonkit/core";
import { useCompoundHandleRef, useCompoundRegistry } from "./CompoundProvider";
import { useCompoundNavigation } from "./useCompoundNavigation";
import { readCompoundInitialIndex, useCompoundPersistence } from "./useCompoundPersistence";

/** Shared compound persistence, navigation, and imperative handle wiring. */
export function useCompoundShell(opts: {
  courseId: CourseId | undefined;
  compoundId: BlockId;
  pageCount: number;
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  persistEnabled: boolean;
  ref: React.Ref<CompoundHandle>;
  enableSolutionsButton?: boolean;
  storage?: StoragePort;
  transformState?: (state: CompoundResumeState) => CompoundResumeState;
  persistTrigger?: number;
}) {
  const ctx = useCompoundRegistry();

  useCompoundPersistence({
    courseId: opts.courseId,
    compoundId: opts.compoundId,
    pageCount: opts.pageCount,
    index: opts.index,
    setIndex: opts.setIndex,
    enabled: opts.persistEnabled,
    storage: opts.storage,
    transformState: opts.transformState,
    persistTrigger: opts.persistTrigger,
  });

  const { goNext, goPrev, progress } = useCompoundNavigation(opts.pageCount, opts.index, opts.setIndex);
  const visibleIndex = clampCompoundPageIndex(opts.index, opts.pageCount);

  useCompoundHandleRef(opts.ref, {
    activePageIndex: visibleIndex,
    setActivePageIndex: opts.setIndex,
    getHandles: () => ctx?.getHandles() ?? new Map(),
    getRegisteredHandles: () => ctx?.getRegisteredHandles() ?? new Map(),
    pageCount: opts.pageCount,
    enableSolutionsButton: opts.enableSolutionsButton,
  });

  return { visibleIndex, goNext, goPrev, progress, ctx };
}

export function useCompoundInitialIndex(opts: {
  courseId: CourseId | undefined;
  compoundId: BlockId;
  pageCount: number;
  persistEnabled: boolean;
  storage?: StoragePort;
}): number {
  return useMemo(
    () =>
      readCompoundInitialIndex(
        opts.courseId,
        opts.compoundId,
        opts.pageCount,
        opts.persistEnabled,
        opts.storage,
      ),
    [opts.courseId, opts.compoundId, opts.pageCount, opts.persistEnabled, opts.storage],
  );
}
