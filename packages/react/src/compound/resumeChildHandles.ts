import type { AssessmentHandle, AssessmentResumeState, CheckId } from "@lessonkit/core";

export type ChildHandleRegistry = Map<CheckId, AssessmentHandle>;

/** Keep only child state entries that have a registered handle (orphan keys are dropped). */
export function filterRegisteredChildStates(
  handles: ChildHandleRegistry,
  childStates: Record<string, AssessmentResumeState>,
): Record<string, AssessmentResumeState> {
  const filtered: Record<string, AssessmentResumeState> = {};
  for (const [key, value] of Object.entries(childStates)) {
    if (handles.has(key as CheckId)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Applies saved child assessment states to registered handles.
 * Returns false when waiting for handles to mount.
 * Orphan keys (renamed/removed checkIds) are ignored once any handle is registered.
 */
export function resumeChildHandles(
  handles: ChildHandleRegistry,
  childStates: Record<string, AssessmentResumeState>,
  opts?: { waitForHandles?: boolean },
): boolean {
  const pendingKeys = Object.keys(childStates);
  if (opts?.waitForHandles && pendingKeys.length > 0) {
    if (handles.size === 0) return false;
    const registeredPending = pendingKeys.filter((k) => handles.has(k as CheckId));
    if (registeredPending.length === 0) {
      return true;
    }
    if (registeredPending.length < pendingKeys.length) {
      for (const key of registeredPending) {
        const handle = handles.get(key as CheckId);
        const child = childStates[key];
        if (handle?.resume && child) handle.resume(child);
      }
      return false;
    }
  }
  for (const [checkId, handle] of handles) {
    const child = childStates[checkId];
    if (child && handle.resume) handle.resume(child);
  }
  return true;
}
