import { describe, expect, it } from "vitest";
import type { AssessmentHandle } from "@lessonkit/core";
import { aggregateAssessmentScores } from "../src/compound/aggregateScores";

function mockHandle(partial: Partial<AssessmentHandle>): AssessmentHandle {
  return {
    getScore: () => 0,
    getMaxScore: () => 1,
    getAnswerGiven: () => false,
    resetTask: () => {},
    showSolutions: () => {},
    getXAPIData: () => ({ interactionType: "trueFalse", checkId: "mock" }),
    ...partial,
  };
}

describe("aggregateAssessmentScores", () => {
  it("returns allAnswered false when no handles match the filter", () => {
    const result = aggregateAssessmentScores([], { answerPageIndex: 0 });
    expect(result.allAnswered).toBe(false);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(0);
  });

  it("coerces non-finite scores to zero", () => {
    const result = aggregateAssessmentScores([
      mockHandle({ getScore: () => Number.NaN, getMaxScore: () => Number.POSITIVE_INFINITY }),
    ]);
    expect(result.score).toBe(0);
    expect(result.maxScore).toBe(0);
  });
});
