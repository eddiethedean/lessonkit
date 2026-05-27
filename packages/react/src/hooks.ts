import { useContext, useMemo } from "react";
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

export function useQuizState() {
  const { track } = useLessonkit();
  return useMemo(
    () => ({
      answer: (opts: { question: string; choice: string; correct: boolean }) => {
        track("quiz_answered", opts);
      },
      complete: (opts?: { score?: number; maxScore?: number }) => {
        track("quiz_completed", opts);
      },
    }),
    [track],
  );
}

