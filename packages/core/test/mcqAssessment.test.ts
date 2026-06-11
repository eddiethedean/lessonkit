import { describe, expect, it } from "vitest";
import {
  isMultiSelectMcq,
  orderChoicesByIndices,
  resolveMcqCorrectAnswers,
  resolveMcqShuffleSeed,
  scoreMcqSelection,
  shuffleChoiceIndices,
} from "../src/mcqAssessment";

describe("mcqAssessment helpers", () => {
  it("detects multi-select when answers length > 1", () => {
    expect(isMultiSelectMcq({ answers: ["A", "B"] })).toBe(true);
    expect(isMultiSelectMcq({ answers: ["A"] })).toBe(false);
    expect(isMultiSelectMcq({})).toBe(false);
  });

  it("resolveMcqCorrectAnswers uses answers when multi-select", () => {
    expect([...resolveMcqCorrectAnswers({ answer: "A", answers: ["A", " B "] })]).toEqual([
      "A",
      "B",
    ]);
  });

  it("resolveMcqCorrectAnswers falls back to single answer", () => {
    expect([...resolveMcqCorrectAnswers({ answer: " Solo " })]).toEqual(["Solo"]);
    expect([...resolveMcqCorrectAnswers({ answer: "A", answers: ["A"] })]).toEqual(["A"]);
    expect([...resolveMcqCorrectAnswers({ answer: "", answers: [] })]).toEqual([]);
  });

  it("scores empty selection as zero", () => {
    const correct = new Set(["A"]);
    expect(scoreMcqSelection(null, correct, false).score).toBe(0);
    expect(scoreMcqSelection([], correct, true).passedThreshold).toBe(false);
  });

  it("scores single-select exact match", () => {
    const correct = new Set(["A"]);
    const result = scoreMcqSelection("A", correct, false);
    expect(result).toMatchObject({
      score: 1,
      maxScore: 1,
      exactMatch: true,
      hasWrongSelection: false,
      passedThreshold: true,
    });
  });

  it("scores multi-select with wrong selection failing exact match", () => {
    const correct = resolveMcqCorrectAnswers({ answer: "A", answers: ["A", "B"] });
    const result = scoreMcqSelection(["A", "C"], correct, true, 2);
    expect(result.score).toBe(1);
    expect(result.hasWrongSelection).toBe(true);
    expect(result.passedThreshold).toBe(false);
  });

  it("scores multi-select pass when all correct and threshold met", () => {
    const correct = resolveMcqCorrectAnswers({ answer: "A", answers: ["A", "B"] });
    const result = scoreMcqSelection(["A", "B"], correct, true, 2);
    expect(result).toMatchObject({
      score: 2,
      maxScore: 2,
      exactMatch: true,
      passedThreshold: true,
    });
  });

  it("shuffle is stable for the same seed", () => {
    const a = shuffleChoiceIndices(4, "quiz-seed");
    const b = shuffleChoiceIndices(4, "quiz-seed");
    expect(a).toEqual(b);
    expect(a).not.toEqual([0, 1, 2, 3]);
  });

  it("shuffle returns identity for length <= 1", () => {
    expect(shuffleChoiceIndices(1, "seed")).toEqual([0]);
    expect(shuffleChoiceIndices(0, "seed")).toEqual([]);
  });

  it("shuffle accepts numeric seed", () => {
    expect(shuffleChoiceIndices(3, 42)).toEqual(shuffleChoiceIndices(3, 42));
  });

  it("resolveMcqShuffleSeed defaults to checkId", () => {
    expect(resolveMcqShuffleSeed({ checkId: "quiz-1" })).toBe("quiz-1");
    expect(resolveMcqShuffleSeed({ checkId: "quiz-1", shuffleSeed: 99 })).toBe(99);
  });

  it("orderChoicesByIndices maps display order", () => {
    expect(orderChoicesByIndices(["A", "B", "C"], [2, 0, 1])).toEqual(["C", "A", "B"]);
    expect(orderChoicesByIndices(["A", "B"], [5])).toEqual([]);
  });
});
