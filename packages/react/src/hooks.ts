import { useContext, useMemo } from "react";
import type { CheckId, LessonId } from "@lessonkit/core";
import { LessonkitContext } from "./context";

/**
 * Access the LessonKit runtime from a component under {@link LessonkitProvider} or {@link Course}.
 *
 * @example
 * ```tsx
 * const { track, completeLesson, progress } = useLessonkit();
 * track("interaction", { label: "help-opened" }, { lessonId: "lesson-1" });
 * ```
 */
export function useLessonkit() {
  const ctx = useContext(LessonkitContext);
  if (!ctx) throw new Error("LessonKit: missing LessonkitProvider");
  return ctx;
}

/**
 * Read course progress state (completed lessons, active lesson).
 *
 * @example
 * ```tsx
 * const { completedLessons, activeLessonId } = useProgress();
 * ```
 *
 * @throws When used outside `LessonkitProvider` / `Course`.
 */
export function useProgress() {
  const { progress } = useLessonkit();
  return progress;
}

/**
 * Emit typed telemetry events from custom UI (`track("interaction", …)`).
 *
 * @example
 * ```tsx
 * const { track } = useTracking();
 * track("interaction", { label: "hint-opened" }, { lessonId: "lesson-1" });
 * ```
 *
 * @throws When used outside `LessonkitProvider` / `Course`.
 */
export function useTracking() {
  const { track } = useLessonkit();
  return useMemo(() => ({ track }), [track]);
}

export function useCompletion() {
  const { completeLesson, completeCourse } = useLessonkit();
  return useMemo(() => ({ completeLesson, completeCourse }), [completeLesson, completeCourse]);
}

export { useAssessmentState } from "./assessment/useAssessmentState";

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
