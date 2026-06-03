import type { AssessmentHandle } from "@lessonkit/core";

export function aggregateAssessmentScores(handles: Iterable<AssessmentHandle>): {
  score: number;
  maxScore: number;
  allAnswered: boolean;
} {
  let score = 0;
  let maxScore = 0;
  let allAnswered = true;
  for (const handle of handles) {
    score += handle.getScore();
    maxScore += handle.getMaxScore();
    if (!handle.getAnswerGiven()) allAnswered = false;
  }
  return { score, maxScore, allAnswered };
}
