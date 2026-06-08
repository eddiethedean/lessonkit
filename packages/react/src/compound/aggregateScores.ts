import type { AssessmentHandle } from "@lessonkit/core";
import type { RegisteredAssessmentHandle } from "./CompoundProvider";

function finiteScore(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function aggregateAssessmentScores(
  handles: Iterable<AssessmentHandle | RegisteredAssessmentHandle>,
  opts?: { answerPageIndex?: number },
): {
  score: number;
  maxScore: number;
  allAnswered: boolean;
} {
  let score = 0;
  let maxScore = 0;
  let allAnswered = true;
  let answerCheckCount = 0;
  for (const entry of handles) {
    const handle = "handle" in entry ? entry.handle : entry;
    const pageIndex = "handle" in entry ? entry.pageIndex : undefined;
    score += finiteScore(handle.getScore());
    maxScore += finiteScore(handle.getMaxScore());
    const countsForAnswerGiven =
      opts?.answerPageIndex === undefined ||
      pageIndex === undefined ||
      pageIndex === opts.answerPageIndex;
    if (countsForAnswerGiven) {
      answerCheckCount += 1;
      if (!handle.getAnswerGiven()) allAnswered = false;
    }
  }
  if (answerCheckCount === 0) {
    allAnswered = false;
  }
  return { score, maxScore, allAnswered };
}
