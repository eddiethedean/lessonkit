import type { AssessmentHandle, AssessmentResumeState, CheckId } from "@lessonkit/core";

export type ChildHandleRegistry = Map<CheckId, AssessmentHandle>;

/** Applies saved child assessment states to registered handles. Returns false when waiting for handles. */
export function resumeChildHandles(
  handles: ChildHandleRegistry,
  childStates: Record<string, AssessmentResumeState>,
  opts?: { waitForHandles?: boolean },
): boolean {
  if (opts?.waitForHandles && handles.size === 0 && Object.keys(childStates).length > 0) {
    return false;
  }
  for (const [checkId, handle] of handles) {
    const child = childStates[checkId];
    if (child && handle.resume) handle.resume(child);
  }
  return true;
}
