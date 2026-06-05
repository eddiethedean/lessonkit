import type { AssessmentHandle, AssessmentResumeState, CheckId } from "@lessonkit/core";

export type ChildHandleRegistry = Map<CheckId, AssessmentHandle>;

/** Applies saved child assessment states to registered handles. Returns false when waiting for handles. */
export function resumeChildHandles(
  handles: ChildHandleRegistry,
  childStates: Record<string, AssessmentResumeState>,
  opts?: { waitForHandles?: boolean },
): boolean {
  const childKeys = Object.keys(childStates);
  if (opts?.waitForHandles && childKeys.length > 0) {
    if (handles.size === 0) return false;
    for (const checkId of childKeys) {
      if (!handles.has(checkId as CheckId)) return false;
    }
  }
  for (const [checkId, handle] of handles) {
    const child = childStates[checkId];
    if (child && handle.resume) handle.resume(child);
  }
  return true;
}
