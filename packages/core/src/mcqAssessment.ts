import type { McqAssessmentProps } from "./assessment";

export type McqScoreResult = {
  score: number;
  maxScore: number;
  exactMatch: boolean;
  hasWrongSelection: boolean;
  passedThreshold: boolean;
};

/** Correct answer labels for scoring (multi-select uses `answers` when length > 1). */
export function resolveMcqCorrectAnswers(props: Pick<McqAssessmentProps, "answer" | "answers">): Set<string> {
  if (props.answers && props.answers.length > 1) {
    return new Set(props.answers.map((a) => a.trim()).filter(Boolean));
  }
  const single = props.answers?.[0]?.trim() ?? props.answer.trim();
  return new Set(single ? [single] : []);
}

export function isMultiSelectMcq(props: Pick<McqAssessmentProps, "answers">): boolean {
  return (props.answers?.length ?? 0) > 1;
}

export function scoreMcqSelection(
  selected: string | string[] | null | undefined,
  correct: Set<string>,
  multi: boolean,
  passingScore?: number,
): McqScoreResult {
  const maxScore = multi ? Math.max(correct.size, 1) : 1;
  if (!selected || (Array.isArray(selected) && selected.length === 0)) {
    return {
      score: 0,
      maxScore,
      exactMatch: false,
      hasWrongSelection: false,
      passedThreshold: false,
    };
  }

  const selectedSet = new Set(
    (Array.isArray(selected) ? selected : [selected]).map((s) => s.trim()).filter(Boolean),
  );
  let score = 0;
  for (const label of selectedSet) {
    if (correct.has(label)) score += 1;
  }
  const hasWrongSelection = [...selectedSet].some((label) => !correct.has(label));
  const exactMatch =
    !hasWrongSelection &&
    selectedSet.size === correct.size &&
    [...correct].every((label) => selectedSet.has(label));
  const threshold = passingScore ?? maxScore;
  const passedThreshold = score >= threshold && !hasWrongSelection;

  return { score, maxScore, exactMatch, hasWrongSelection, passedThreshold };
}

function hashSeedToNumber(seed: string | number): number {
  if (typeof seed === "number" && Number.isFinite(seed)) return Math.abs(Math.trunc(seed)) || 1;
  let hash = 2166136261;
  const text = String(seed);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

/** Deterministic Fisher–Yates shuffle; returns display order indices. */
export function shuffleChoiceIndices(length: number, seed: string | number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  if (length <= 1) return indices;
  let state = hashSeedToNumber(seed);
  for (let i = length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return indices;
}

export function resolveMcqShuffleSeed(
  props: Pick<McqAssessmentProps, "checkId" | "shuffleSeed">,
): string | number {
  return props.shuffleSeed ?? props.checkId;
}

export function orderChoicesByIndices(choices: string[], orderIndices: number[]): string[] {
  return orderIndices.map((index) => choices[index] ?? "").filter((c) => c.length > 0);
}
