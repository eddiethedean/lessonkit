import type { AssessmentScoreResult, CheckId, LessonId } from "@lessonkit/core";
import { useCallback } from "react";
import { useLessonkit } from "../../hooks";
import { buildPluginContext } from "../../runtime/plugins";
import { meetsPassingThreshold, scoreFromCustom } from "../scoring";

export function usePluginScoring(checkId: CheckId, lessonId: LessonId) {
  const { plugins, config, session } = useLessonkit();

  const getPluginScore = useCallback(
    (response: unknown): AssessmentScoreResult | null => {
      const pluginCtx = buildPluginContext({
        courseId: config.courseId,
        sessionId: session.sessionId,
        attemptId: session.attemptId,
        user: session.user,
      });
      return plugins?.scoreAssessment({ checkId, lessonId, response }, pluginCtx) ?? null;
    },
    [checkId, config.courseId, lessonId, plugins, session.attemptId, session.sessionId, session.user],
  );

  const scoreResponse = useCallback(
    (response: unknown, defaultCorrect: boolean, maxScore = 1, passingScore?: number) =>
      scoreFromCustom(getPluginScore(response), defaultCorrect, maxScore, passingScore),
    [getPluginScore],
  );

  const isChoiceCorrect = useCallback(
    (choice: string, answer: string, custom: AssessmentScoreResult | null, passingScore?: number) => {
      if (!custom) return choice === answer;
      if (custom.passed !== undefined) return custom.passed;
      if (custom.maxScore != null && custom.maxScore > 0 && custom.score != null) {
        return meetsPassingThreshold(custom.score, custom.maxScore, passingScore);
      }
      return choice === answer;
    },
    [],
  );

  return { getPluginScore, scoreResponse, isChoiceCorrect };
}
