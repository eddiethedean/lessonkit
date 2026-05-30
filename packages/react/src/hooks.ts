import { useContext, useMemo } from "react";
import type { CheckId, LessonId } from "@lessonkit/core";
import { LessonkitContext } from "./context";

export function useLessonkit() {
  const ctx = useContext(LessonkitContext);
  if (!ctx) throw new Error("LessonKit: missing LessonkitProvider");
  return ctx;
}

export function useProgress() {
  const { progress } = useLessonkit();
  return progress;
}

export function useTracking() {
  const { track } = useLessonkit();
  return useMemo(() => ({ track }), [track]);
}

export function useCompletion() {
  const { completeLesson, completeCourse } = useLessonkit();
  return useMemo(() => ({ completeLesson, completeCourse }), [completeLesson, completeCourse]);
}

export function useQuizState(enclosingLessonId?: LessonId) {
  const { track } = useLessonkit();
  const trackOpts = enclosingLessonId ? { lessonId: enclosingLessonId } : undefined;
  return useMemo(
    () => ({
      answer: (opts: {
        checkId: CheckId;
        question: string;
        choice: string;
        correct: boolean;
      }) => {
        track("quiz_answered", opts, trackOpts);
      },
      complete: (opts: { checkId: CheckId; score?: number; maxScore?: number; passingScore?: number }) => {
        track("quiz_completed", opts, trackOpts);
      },
    }),
    [track, enclosingLessonId],
  );
}
