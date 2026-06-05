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
