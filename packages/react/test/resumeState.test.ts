import { describe, expect, it } from "vitest";
import { restoreCompletedRefFromResumeState } from "../src/assessment/internal/resumeState";

describe("restoreCompletedRefFromResumeState", () => {
  it("prefers explicit completed field", () => {
    const completedRef = { current: false };
    restoreCompletedRefFromResumeState(completedRef, { completed: true });
    expect(completedRef.current).toBe(true);
  });

  it("legacy fallback uses submitted for failed terminal attempts", () => {
    const completedRef = { current: false };
    restoreCompletedRefFromResumeState(
      completedRef,
      { passed: false, submitted: true },
      { enableRetry: false },
    );
    expect(completedRef.current).toBe(true);
  });

  it("legacy fallback uses checked only when enableRetry is false", () => {
    const completedRef = { current: false };
    restoreCompletedRefFromResumeState(
      completedRef,
      { passed: false, checked: true },
      { enableRetry: false },
    );
    expect(completedRef.current).toBe(true);

    completedRef.current = false;
    restoreCompletedRefFromResumeState(
      completedRef,
      { passed: false, checked: true },
      { enableRetry: true },
    );
    expect(completedRef.current).toBe(false);
  });
});
