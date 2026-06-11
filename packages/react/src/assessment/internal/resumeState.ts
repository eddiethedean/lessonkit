import type { AssessmentResumeState } from "@lessonkit/core";

export function readBooleanField(
  state: AssessmentResumeState,
  key: string,
): boolean | null | undefined {
  const value = state[key];
  if (value === true || value === false || value === null) return value;
  return undefined;
}

export function readStringField(
  state: AssessmentResumeState,
  key: string,
): string | null | undefined {
  const value = state[key];
  if (typeof value === "string" || value === null) return value;
  return undefined;
}

export function readNumberField(
  state: AssessmentResumeState,
  key: string,
): number | null | undefined {
  const value = state[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null) return null;
  return undefined;
}

export function readBooleanStateField(
  state: AssessmentResumeState,
  key: string,
  apply: (value: boolean) => void,
): void {
  const value = state[key];
  if (typeof value === "boolean") apply(value);
}

export type RestoreCompletedRefOptions = {
  /** When true, legacy `checked` alone does not mark a terminal attempt (retry after wrong check). */
  enableRetry?: boolean;
};

/**
 * Restore `completedRef` from persisted compound resume state.
 * Prefers explicit `completed`; falls back to legacy `passed` / `submitted` / `checked` fields.
 */
export function restoreCompletedRefFromResumeState(
  completedRef: { current: boolean },
  state: AssessmentResumeState,
  opts?: RestoreCompletedRefOptions,
): void {
  const completed = readBooleanField(state, "completed");
  if (completed === true || completed === false) {
    completedRef.current = completed;
    return;
  }
  const passed = readBooleanField(state, "passed") === true;
  const submitted = readBooleanField(state, "submitted") === true;
  const checked = readBooleanField(state, "checked") === true;
  const enableRetry = opts?.enableRetry ?? false;
  completedRef.current = passed || submitted || (checked && !enableRetry);
}
