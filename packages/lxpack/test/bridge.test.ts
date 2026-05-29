import { describe, expect, it } from "vitest";
import {
  normalizeAssessmentPassingScore,
  normalizeAssessmentScore,
} from "../src/bridge";

describe("@lessonkit/lxpack/bridge", () => {
  it("normalizeAssessmentScore scales raw score by maxScore", () => {
    expect(normalizeAssessmentScore({ score: 1, maxScore: 2 })).toBe(0.5);
    expect(normalizeAssessmentScore({ score: 2, maxScore: 2 })).toBe(1);
  });

  it("normalizeAssessmentScore clamps to 1", () => {
    expect(normalizeAssessmentScore({ score: 3, maxScore: 2 })).toBe(1);
  });

  it("normalizeAssessmentScore returns null when score is missing", () => {
    expect(normalizeAssessmentScore({})).toBeNull();
    expect(normalizeAssessmentScore({ maxScore: 2 })).toBeNull();
  });

  it("normalizeAssessmentPassingScore defaults to 1", () => {
    expect(normalizeAssessmentPassingScore()).toBe(1);
    expect(normalizeAssessmentPassingScore({ passingScore: 0.8 })).toBe(0.8);
    expect(normalizeAssessmentPassingScore({ passingScore: 0 })).toBe(1);
  });

  it("normalizeAssessmentPassingScore scales raw threshold by maxScore", () => {
    expect(normalizeAssessmentPassingScore({ passingScore: 2, maxScore: 4 })).toBe(0.5);
    expect(normalizeAssessmentPassingScore({ passingScore: 1, maxScore: 1 })).toBe(1);
  });

  it("normalizeAssessmentPassingScore clamps to 1", () => {
    expect(normalizeAssessmentPassingScore({ passingScore: 3, maxScore: 2 })).toBe(1);
  });
});
