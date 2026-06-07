import type { AssessmentHandle, AssessmentResumeState, CheckId } from "@lessonkit/core";
import { BS_META_KEY } from "./useCompoundBranchShell";
import { IV_META_KEY } from "./useCompoundVideoShell";

export type ChildHandleRegistry = Map<CheckId, AssessmentHandle>;

const DEFAULT_PRESERVED_CHILD_STATE_KEYS = new Set<string>([BS_META_KEY, IV_META_KEY]);

/** Pending child-state keys that require a registered assessment handle. */
export function registerablePendingKeys(
  childStates: Record<string, AssessmentResumeState>,
  preserveKeys: ReadonlySet<string> = DEFAULT_PRESERVED_CHILD_STATE_KEYS,
): string[] {
  return Object.keys(childStates).filter((key) => !preserveKeys.has(key));
}

/** Keep only child state entries that have a registered handle (orphan keys are dropped). */
export function filterRegisteredChildStates(
  handles: ChildHandleRegistry,
  childStates: Record<string, AssessmentResumeState>,
  preserveKeys: ReadonlySet<string> = DEFAULT_PRESERVED_CHILD_STATE_KEYS,
): Record<string, AssessmentResumeState> {
  const filtered: Record<string, AssessmentResumeState> = {};
  for (const [key, value] of Object.entries(childStates)) {
    if (preserveKeys.has(key) || handles.has(key as CheckId)) {
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
export type ResumeChildHandlesOpts = {
  waitForHandles?: boolean;
  /** Keys already resumed in a prior partial pass (avoids double resume on lazy mount). */
  alreadyResumed?: Set<string>;
};

export function resumeChildHandles(
  handles: ChildHandleRegistry,
  childStates: Record<string, AssessmentResumeState>,
  opts?: ResumeChildHandlesOpts,
): boolean {
  const alreadyResumed = opts?.alreadyResumed;
  const registerableKeys = registerablePendingKeys(childStates);

  if (opts?.waitForHandles && registerableKeys.length > 0) {
    if (handles.size === 0) return false;
    const registeredPending = registerableKeys.filter((k) => handles.has(k as CheckId));
    if (registeredPending.length === 0) {
      return false;
    }
    if (registeredPending.length < registerableKeys.length) {
      for (const key of registeredPending) {
        if (alreadyResumed?.has(key)) continue;
        const handle = handles.get(key as CheckId);
        const child = childStates[key];
        if (handle?.resume && child) {
          handle.resume(child);
          alreadyResumed?.add(key);
        }
      }
      return false;
    }
  }

  for (const [checkId, handle] of handles) {
    if (alreadyResumed?.has(checkId)) continue;
    const child = childStates[checkId];
    if (child && handle.resume) {
      handle.resume(child);
      alreadyResumed?.add(checkId);
    }
  }
  return true;
}
