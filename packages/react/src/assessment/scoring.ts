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
  const hasNumericScore = custom?.score != null && Number.isFinite(custom.score);
  if (hasNumericScore && maxScore <= 0) {
    const score = fallbackCorrect ? fallbackMax : 0;
    const passed = meetsPassingThreshold(score, fallbackMax, passingScore);
    return { score, maxScore: fallbackMax, passed };
  }
  if (hasNumericScore) {
    const passed =
      custom!.passed !== undefined
        ? custom!.passed
        : meetsPassingThreshold(custom!.score!, maxScore, passingScore);
    return { score: custom!.score!, maxScore, passed };
  }
  if (custom?.passed !== undefined) {
    const score = custom.passed ? maxScore : 0;
    return { score, maxScore, passed: custom.passed };
  }
  const score = fallbackCorrect ? maxScore : 0;
  const passed = meetsPassingThreshold(score, maxScore, passingScore);
  return { score, maxScore, passed };
}
