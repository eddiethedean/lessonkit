import type { AssessmentScoreResult } from "@lessonkit/core";

/** Absolute point threshold; defaults to maxScore when passingScore is omitted. */
export function resolvePassingThreshold(
  passingScore: number | undefined,
  maxScore: number,
): number {
  return passingScore ?? maxScore;
}

export function meetsPassingThreshold(
  score: number,
  maxScore: number,
  passingScore?: number,
): boolean {
  const threshold = resolvePassingThreshold(passingScore, maxScore);
  return score >= threshold;
}

export function scoreFromCustom(
  custom: AssessmentScoreResult | null,
  fallbackCorrect: boolean,
  fallbackMax = 1,
  passingScore?: number,
): { score: number; maxScore: number; passed: boolean } {
  const maxScore = custom?.maxScore ?? fallbackMax;
  if (custom?.passed !== undefined) {
    const score = custom.passed ? (custom.score ?? maxScore) : (custom.score ?? 0);
    return { score, maxScore, passed: custom.passed };
  }
  if (custom?.maxScore != null && custom.maxScore > 0 && custom.score != null) {
    const passed = meetsPassingThreshold(custom.score, custom.maxScore, passingScore);
    return { score: custom.score, maxScore: custom.maxScore, passed };
  }
  const score = fallbackCorrect ? maxScore : 0;
  const passed = meetsPassingThreshold(score, maxScore, passingScore);
  return { score, maxScore, passed };
}
