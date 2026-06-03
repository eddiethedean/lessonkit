import type React from "react";
import { useCallback } from "react";
import type { CourseId, HeadlessLessonkitRuntime, LessonId, TelemetryEmitFn } from "@lessonkit/core";
import type { ProgressController } from "../runtime/progress";

type ProgressBridgeOpts = {
  useV2Runtime: boolean;
  headlessRef: React.MutableRefObject<HeadlessLessonkitRuntime | null>;
  progressRef: React.MutableRefObject<ProgressController>;
  syncProgress: () => void;
  emitLifecycleEvent: TelemetryEmitFn;
  emitLessonCompleted: (lessonId: LessonId, durationMs?: number) => void;
  track: (name: "lesson_started" | "course_completed", data?: { lessonId?: LessonId }, opts?: { lessonId?: LessonId }) => void;
  trackingRef: React.MutableRefObject<{ flush?: () => void | Promise<void> }>;
  courseIdRef: React.MutableRefObject<CourseId>;
};

/** Progress completion and active-lesson bridge for v1/v2 runtime. */
export function useProgressBridge(opts: ProgressBridgeOpts) {
  const {
    useV2Runtime,
    headlessRef,
    progressRef,
    syncProgress,
    emitLifecycleEvent,
    emitLessonCompleted,
    track,
    trackingRef,
    courseIdRef,
  } = opts;

  const completeLesson = useCallback(
    (lessonId: LessonId, bridgeOpts?: { courseId?: CourseId }) => {
      if (bridgeOpts?.courseId !== undefined && bridgeOpts.courseId !== courseIdRef.current) {
        return;
      }
      if (useV2Runtime && headlessRef.current) {
        headlessRef.current.completeLesson(lessonId, emitLifecycleEvent);
        syncProgress();
        void Promise.resolve(trackingRef.current?.flush?.());
        return;
      }
      const result = progressRef.current.completeLesson(lessonId, Date.now());
      if (!result.didComplete) return;
      syncProgress();
      emitLessonCompleted(lessonId, result.durationMs);
      void Promise.resolve(trackingRef.current?.flush?.());
    },
    [useV2Runtime, headlessRef, progressRef, syncProgress, emitLifecycleEvent, emitLessonCompleted, trackingRef, courseIdRef],
  );

  const setActiveLesson = useCallback(
    (lessonId: LessonId) => {
      if (useV2Runtime && headlessRef.current) {
        headlessRef.current.setActiveLesson(lessonId, emitLifecycleEvent);
        syncProgress();
        void Promise.resolve(trackingRef.current?.flush?.());
        return;
      }
      const current = progressRef.current.getState();
      if (current.activeLessonId === lessonId) return;
      if (current.completedLessonIds.has(lessonId)) {
        progressRef.current.setActiveLesson(lessonId, Date.now());
        syncProgress();
        return;
      }
      const previous = current.activeLessonId;
      if (previous && previous !== lessonId) {
        const completed = progressRef.current.completeLesson(previous, Date.now());
        if (completed.didComplete) {
          emitLessonCompleted(previous, completed.durationMs);
          void Promise.resolve(trackingRef.current?.flush?.());
        }
      }
      progressRef.current.setActiveLesson(lessonId, Date.now());
      syncProgress();
      track("lesson_started", { lessonId }, { lessonId });
    },
    [useV2Runtime, headlessRef, progressRef, syncProgress, emitLifecycleEvent, emitLessonCompleted, track, trackingRef],
  );

  const completeCourse = useCallback(() => {
    if (useV2Runtime && headlessRef.current) {
      headlessRef.current.completeCourse(emitLifecycleEvent);
      syncProgress();
      void trackingRef.current?.flush?.();
      return;
    }
    const current = progressRef.current.getState();
    if (current.activeLessonId) {
      const lessonResult = progressRef.current.completeLesson(current.activeLessonId, Date.now());
      if (lessonResult.didComplete) {
        emitLessonCompleted(current.activeLessonId, lessonResult.durationMs);
      }
    }
    const result = progressRef.current.completeCourse();
    if (!result.didComplete) return;
    syncProgress();
    track("course_completed");
    void trackingRef.current?.flush?.();
  }, [useV2Runtime, headlessRef, progressRef, syncProgress, emitLifecycleEvent, emitLessonCompleted, track, trackingRef]);

  return { completeLesson, setActiveLesson, completeCourse };
}
