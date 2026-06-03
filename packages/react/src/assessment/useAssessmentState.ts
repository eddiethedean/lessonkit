import { useMemo } from "react";
import type {
  AssessmentAnsweredData,
  AssessmentCompletedData,
  LessonId,
} from "@lessonkit/core";
import { useLessonkit } from "../hooks";

export function useAssessmentState(enclosingLessonId?: LessonId) {
  const { track } = useLessonkit();
  const trackOpts = enclosingLessonId ? { lessonId: enclosingLessonId } : undefined;

  return useMemo(
    () => ({
      answer: (data: AssessmentAnsweredData) => {
        track("assessment_answered", data, trackOpts);
      },
      complete: (data: AssessmentCompletedData) => {
        track("assessment_completed", data, trackOpts);
      },
    }),
    [track, enclosingLessonId],
  );
}
