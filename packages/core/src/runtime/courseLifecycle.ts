import type { CourseId, LessonId } from "../identityTypes";
import type { TelemetryUser } from "../telemetryTypes";
import { buildTelemetryEvent } from "../telemetryBuilder";
import type { PluginRegistry } from "../plugins/types";
import type { ProgressController } from "../progress";
import type { StoragePort } from "../ports";
import {
  hasCourseStarted,
  hasCourseStartedEmittedToTracking,
  markCourseStarted,
} from "../session";

const courseStartedEmitFlights = new Map<string, Promise<{ emitted: boolean; marked: boolean }>>();

/** @internal Reset in-flight course_started guard between tests. */
export function resetCourseStartedEmitFlightForTests(): void {
  courseStartedEmitFlights.clear();
}

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

/**
 * Emit `course_started` once per tab session when tracking/xAPI are active.
 * Coalesces concurrent calls via an in-flight guard.
 */
export function tryEmitCourseStarted(
  ctx: CourseLifecycleContext,
  deps: CourseLifecycleDeps,
  alreadyEmittedToSink: boolean,
): Promise<{ emitted: boolean; marked: boolean }> {
  const flightKey = `${ctx.sessionId}:${ctx.courseId}`;
  const marked = hasCourseStarted(ctx.storage, ctx.sessionId, ctx.courseId);
  if (alreadyEmittedToSink) {
    const markPersisted = marked
      ? true
      : markCourseStarted(ctx.storage, ctx.sessionId, ctx.courseId);
    return Promise.resolve({
      emitted: true,
      marked: markPersisted,
    });
  }

  if (
    marked &&
    hasCourseStartedEmittedToTracking(ctx.storage, ctx.sessionId, ctx.courseId)
  ) {
    return Promise.resolve({
      emitted: true,
      marked: true,
    });
  }

  const existing = courseStartedEmitFlights.get(flightKey);
  if (existing) {
    return existing;
  }

  const flight = Promise.resolve().then(() => {
    try {
      const emitted = deps.emitCourseStartedEvent(ctx);
      const markPersisted =
        emitted && !marked
          ? markCourseStarted(ctx.storage, ctx.sessionId, ctx.courseId)
          : marked;
      return {
        emitted,
        marked: markPersisted,
      };
    } catch {
      return {
        emitted: false,
        marked: hasCourseStarted(ctx.storage, ctx.sessionId, ctx.courseId),
      };
    } finally {
      if (courseStartedEmitFlights.get(flightKey) === flight) {
        courseStartedEmitFlights.delete(flightKey);
      }
    }
  });
  courseStartedEmitFlights.set(flightKey, flight);

  return flight;
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

/**
 * Mark a lesson complete in progress state and emit `lesson_completed` when newly completed.
 *
 * @example
 * ```ts
 * completeLessonWithTelemetry({
 *   progress,
 *   lessonId: "lesson-1",
 *   nowMs: Date.now(),
 *   emitLessonCompleted: (id, durationMs) => track("lesson_completed", { lessonId: id, durationMs }),
 * });
 * ```
 */
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

/**
 * Complete the active lesson (if any), then mark the course complete and emit `course_completed`.
 *
 * @example
 * ```ts
 * completeCourseWithTelemetry({
 *   progress,
 *   nowMs: Date.now(),
 *   emitLessonCompleted: (id) => track("lesson_completed", { lessonId: id }),
 *   emitCourseCompleted: () => track("course_completed", {}),
 * });
 * ```
 */
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
  if (!result.didComplete) {
    const after = opts.progress.getState();
    if (after.activeLessonId) {
      const lessonResult = opts.progress.completeLesson(after.activeLessonId, opts.nowMs);
      if (lessonResult.didComplete) {
        opts.emitLessonCompleted(after.activeLessonId, lessonResult.durationMs);
      }
    }
    return false;
  }
  opts.emitCourseCompleted();
  return true;
}
