import type { LessonId, TelemetryEventName } from "@lessonkit/core";

export type ProgressState = {
  activeLessonId?: LessonId;
  completedLessonIds: ReadonlySet<LessonId>;
  courseCompleted: boolean;
};

export type ProgressController = {
  getState: () => ProgressState;
  setActiveLesson: (lessonId: LessonId, startedAtMs: number) => { previousLessonId?: LessonId };
  completeLesson: (lessonId: LessonId, completedAtMs: number) => { durationMs?: number; didComplete: boolean };
  completeCourse: () => { didComplete: boolean };
};

export function createProgressController(): ProgressController {
  let activeLessonId: LessonId | undefined;
  let completedLessonIds = new Set<LessonId>();
  let courseCompleted = false;
  const lessonStartTimes = new Map<LessonId, number>();

  return {
    getState: () => ({
      activeLessonId,
      completedLessonIds: new Set(completedLessonIds),
      courseCompleted,
    }),
    setActiveLesson: (lessonId, startedAtMs) => {
      const previousLessonId = activeLessonId;
      activeLessonId = lessonId;
      lessonStartTimes.set(lessonId, startedAtMs);
      return { previousLessonId };
    },
    completeLesson: (lessonId, completedAtMs) => {
      if (completedLessonIds.has(lessonId)) return { didComplete: false };
      completedLessonIds = new Set(completedLessonIds).add(lessonId);
      const startedAt = lessonStartTimes.get(lessonId);
      lessonStartTimes.delete(lessonId);
      const durationMs =
        typeof startedAt === "number" ? Math.max(0, completedAtMs - startedAt) : undefined;
      return { durationMs, didComplete: true };
    },
    completeCourse: () => {
      if (courseCompleted) return { didComplete: false };
      courseCompleted = true;
      return { didComplete: true };
    },
  };
}

