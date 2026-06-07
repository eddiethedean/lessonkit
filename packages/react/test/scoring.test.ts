import { describe, expect, it } from "vitest";
import {
  meetsPassingThreshold,
  scoreFromCustom,
} from "../src/assessment/scoring";

describe("scoreFromCustom", () => {
  it("uses explicit passed flag and score", () => {
    expect(scoreFromCustom({ passed: true, score: 2, maxScore: 3 }, false)).toEqual({
      score: 2,
      maxScore: 3,
      passed: true,
    });
    expect(scoreFromCustom({ passed: false, score: 1, maxScore: 3 }, true)).toEqual({
      score: 1,
      maxScore: 3,
      passed: false,
    });
    expect(scoreFromCustom({ passed: true, score: 2, maxScore: 2 }, false)).toEqual({
      score: 2,
      maxScore: 2,
      passed: true,
    });
    expect(scoreFromCustom({ passed: false, score: 0, maxScore: 2 }, true)).toEqual({
      score: 0,
      maxScore: 2,
      passed: false,
    });
  });

  it("honors numeric score when passed is false", () => {
    expect(scoreFromCustom({ passed: false, score: 2, maxScore: 5 }, true)).toEqual({
      score: 2,
      maxScore: 5,
      passed: false,
    });
    expect(scoreFromCustom({ passed: false, score: 0, maxScore: 3 }, true)).toEqual({
      score: 0,
      maxScore: 3,
      passed: false,
    });
  });

  it("derives pass from score ratio when passed is omitted", () => {
    expect(scoreFromCustom({ score: 2, maxScore: 2 }, false)).toEqual({
      score: 2,
      maxScore: 2,
      passed: true,
    });
    expect(scoreFromCustom({ score: 1, maxScore: 2 }, true)).toEqual({
      score: 1,
      maxScore: 2,
      passed: false,
    });
  });

  it("falls back to boolean correctness", () => {
    expect(scoreFromCustom(null, true, 5)).toEqual({ score: 5, maxScore: 5, passed: true });
    expect(scoreFromCustom(null, false)).toEqual({ score: 0, maxScore: 1, passed: false });
  });

  it("applies passingScore threshold for ratio and fallback scores", () => {
    expect(scoreFromCustom({ score: 2, maxScore: 4 }, false, 4, 2)).toEqual({
      score: 2,
      maxScore: 4,
      passed: true,
    });
    expect(scoreFromCustom({ score: 1, maxScore: 4 }, true, 4, 2)).toEqual({
      score: 1,
      maxScore: 4,
      passed: false,
    });
    expect(scoreFromCustom(null, true, 4, 2)).toEqual({
      score: 4,
      maxScore: 4,
      passed: true,
    });
  });

  it("meetsPassingThreshold uses absolute points", () => {
    expect(meetsPassingThreshold(2, 4, 2)).toBe(true);
    expect(meetsPassingThreshold(1, 4, 2)).toBe(false);
    expect(meetsPassingThreshold(4, 4)).toBe(true);
  });
});
