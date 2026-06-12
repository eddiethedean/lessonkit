import { describe, expect, it } from "vitest";
import {
  isTerminalAssessmentResumeState,
  restoreCompletedRefFromResumeState,
  shouldReplayAssessmentComplete,
} from "../src/assessment/internal/resumeState";

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

describe("isTerminalAssessmentResumeState", () => {
  it("returns true for explicit completed", () => {
    expect(isTerminalAssessmentResumeState({ completed: true })).toBe(true);
    expect(isTerminalAssessmentResumeState({ completed: false })).toBe(false);
  });

  it("returns true for failed terminal checked with enableRetry false", () => {
    expect(
      isTerminalAssessmentResumeState(
        { checked: true, passed: false, completed: true },
        false,
      ),
    ).toBe(true);
  });

  it("returns false for in-progress retry after wrong check", () => {
    expect(
      isTerminalAssessmentResumeState({ checked: true, passed: false }, true),
    ).toBe(false);
  });

  it("returns true for passed state", () => {
    expect(isTerminalAssessmentResumeState({ passed: true })).toBe(true);
  });
});

describe("shouldReplayAssessmentComplete", () => {
  it("returns true on pass or terminal fail", () => {
    expect(shouldReplayAssessmentComplete(true, true)).toBe(true);
    expect(shouldReplayAssessmentComplete(false, false)).toBe(true);
    expect(shouldReplayAssessmentComplete(false, true)).toBe(false);
  });
});
