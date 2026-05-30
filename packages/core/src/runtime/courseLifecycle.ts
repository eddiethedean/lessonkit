import type { CourseId, LessonId } from "../identityTypes";
import type { TelemetryUser } from "../telemetryTypes";
import { buildTelemetryEvent } from "../telemetryBuilder";
import type { PluginRegistry } from "../plugins/types";
import type { ProgressController } from "../progress";
import type { StoragePort } from "../ports";
import { hasCourseStarted, markCourseStarted } from "../session";

export type CourseLifecycleContext = {
  courseId: CourseId;
  sessionId: string;
  attemptId?: string;
  user?: TelemetryUser;
  storage: StoragePort;
  pluginHost: PluginRegistry | null;
  lxpackBridge: "auto" | "off";
};

export type CourseLifecycleDeps = {
  emitCourseStartedEvent: (ctx: CourseLifecycleContext) => boolean;
};

export function tryEmitCourseStarted(
  ctx: CourseLifecycleContext,
  deps: CourseLifecycleDeps,
  alreadyEmittedToSink: boolean,
): { emitted: boolean; marked: boolean } {
  const marked = hasCourseStarted(ctx.storage, ctx.sessionId, ctx.courseId);
  if (alreadyEmittedToSink) {
    return { emitted: true, marked };
  }
  if (marked) {
    return { emitted: false, marked: true };
  }
  const emitted = deps.emitCourseStartedEvent(ctx);
  if (emitted) {
    markCourseStarted(ctx.storage, ctx.sessionId, ctx.courseId);
  }
  return { emitted, marked: emitted };
}

export function buildCourseStartedTelemetryEvent(ctx: CourseLifecycleContext) {
  return buildTelemetryEvent({
    name: "course_started",
    courseId: ctx.courseId,
    sessionId: ctx.sessionId,
    attemptId: ctx.attemptId,
    user: ctx.user,
  });
}

export type LessonCompletionEmitter = (
  lessonId: LessonId,
  durationMs?: number,
) => void;

export function completeLessonWithTelemetry(opts: {
  progress: ProgressController;
  lessonId: LessonId;
  nowMs: number;
  emitLessonCompleted: LessonCompletionEmitter;
}): boolean {
  const result = opts.progress.completeLesson(opts.lessonId, opts.nowMs);
  if (!result.didComplete) return false;
  opts.emitLessonCompleted(opts.lessonId, result.durationMs);
  return true;
}

export function completeCourseWithTelemetry(opts: {
  progress: ProgressController;
  nowMs: number;
  emitLessonCompleted: LessonCompletionEmitter;
  emitCourseCompleted: () => void;
}): boolean {
  const current = opts.progress.getState();
  if (current.activeLessonId) {
    completeLessonWithTelemetry({
      progress: opts.progress,
      lessonId: current.activeLessonId,
      nowMs: opts.nowMs,
      emitLessonCompleted: opts.emitLessonCompleted,
    });
  }
  const result = opts.progress.completeCourse();
  if (!result.didComplete) return false;
  opts.emitCourseCompleted();
  return true;
}
