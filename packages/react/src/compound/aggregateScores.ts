import type { AssessmentHandle } from "@lessonkit/core";
import type { RegisteredAssessmentHandle } from "./CompoundProvider";

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
  for (const entry of handles) {
    const handle = "handle" in entry ? entry.handle : entry;
    const pageIndex = "handle" in entry ? entry.pageIndex : undefined;
    score += handle.getScore();
    maxScore += handle.getMaxScore();
    const countsForAnswerGiven =
      opts?.answerPageIndex === undefined ||
      pageIndex === undefined ||
      pageIndex === opts.answerPageIndex;
    if (countsForAnswerGiven && !handle.getAnswerGiven()) allAnswered = false;
  }
  return { score, maxScore, allAnswered };
}
