import type { AssessmentScoreResult } from "@lessonkit/core";

export function scoreFromCustom(
  custom: AssessmentScoreResult | null,
  fallbackCorrect: boolean,
  fallbackMax = 1,
): { score: number; maxScore: number; passed: boolean } {
  const maxScore = custom?.maxScore ?? fallbackMax;
  if (custom?.passed !== undefined) {
    const score = custom.passed ? (custom.score ?? maxScore) : (custom.score ?? 0);
    return { score, maxScore, passed: custom.passed };
  }
  if (custom?.maxScore != null && custom.maxScore > 0 && custom.score != null) {
    const passed = custom.score / custom.maxScore >= 1;
    return { score: custom.score, maxScore: custom.maxScore, passed };
  }
  const score = fallbackCorrect ? maxScore : 0;
  return { score, maxScore, passed: fallbackCorrect };
}
