import { describe, expect, it } from "vitest";
import {
  isMultiSelectMcq,
  resolveMcqCorrectAnswers,
  scoreMcqSelection,
  shuffleChoiceIndices,
} from "../src/mcqAssessment";

describe("mcqAssessment helpers", () => {
  it("detects multi-select when answers length > 1", () => {
    expect(isMultiSelectMcq({ answers: ["A", "B"] })).toBe(true);
    expect(isMultiSelectMcq({ answers: ["A"] })).toBe(false);
    expect(isMultiSelectMcq({})).toBe(false);
  });

  it("scores multi-select with wrong selection failing exact match", () => {
    const correct = resolveMcqCorrectAnswers({ answer: "A", answers: ["A", "B"] });
    const result = scoreMcqSelection(["A", "C"], correct, true, 2);
    expect(result.score).toBe(1);
    expect(result.hasWrongSelection).toBe(true);
    expect(result.passedThreshold).toBe(false);
  });

  it("shuffle is stable for the same seed", () => {
    const a = shuffleChoiceIndices(4, "quiz-seed");
    const b = shuffleChoiceIndices(4, "quiz-seed");
    expect(a).toEqual(b);
    expect(a).not.toEqual([0, 1, 2, 3]);
  });
});
