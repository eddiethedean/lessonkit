import type {
  CourseId,
  InteractionData,
  LessonId,
  LessonLifecycleData,
  QuizAnsweredData,
  QuizCompletedData,
  TelemetryEvent,
  TelemetryEventName,
  TelemetryUser,
  TrackingClient,
} from "@lessonkit/core";
import { nowIso } from "@lessonkit/core";
import type { XAPIClient } from "@lessonkit/xapi";
import { telemetryEventToXAPIStatement } from "@lessonkit/xapi";
import { forwardTelemetryToLxpack, type LxpackBridgeMode } from "./lxpackBridge";

let warnedMissingCourseId = false;
let warnedMissingQuizLesson = false;

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { NODE_ENV?: string } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

export function emitTelemetry(
  tracking: TrackingClient,
  xapi: XAPIClient | null,
  event: TelemetryEvent,
  opts?: { lxpackBridge?: LxpackBridgeMode },
): void {
  if (!event.courseId) {
    if (isDevEnvironment() && !warnedMissingCourseId) {
      warnedMissingCourseId = true;
      console.warn("[lessonkit] telemetry event missing courseId");
    }
    return;
  }
  tracking.track(event);
  try {
    const statement = telemetryEventToXAPIStatement(event);
    if (statement) xapi?.send(statement);
  } catch (err) {
    if (isDevEnvironment()) {
      console.warn("[lessonkit] xAPI mapping skipped:", err instanceof Error ? err.message : err);
    }
  }

  forwardTelemetryToLxpack(event, opts?.lxpackBridge ?? "auto");
}

export function buildTrackEvent(opts: {
  name: TelemetryEventName;
  courseId: CourseId;
  lessonId?: LessonId;
  sessionId?: string;
  attemptId?: string;
  user?: TelemetryUser;
  data?: unknown;
}): TelemetryEvent {
  const base = {
    timestamp: nowIso(),
    courseId: opts.courseId,
    sessionId: opts.sessionId,
    attemptId: opts.attemptId,
    user: opts.user,
  };

  switch (opts.name) {
    case "course_started":
      return { name: "course_started", ...base };
    case "course_completed":
      return { name: "course_completed", ...base };
    case "lesson_started": {
      const data = opts.data as LessonLifecycleData | undefined;
      const lessonId = opts.lessonId ?? data?.lessonId;
      if (!lessonId) throw new Error("lesson_started requires lessonId");
      return {
        name: "lesson_started",
        ...base,
        lessonId,
        data: { lessonId, ...data },
      };
    }
    case "lesson_completed":
    case "lesson_time_on_task": {
      const data = opts.data as LessonLifecycleData | undefined;
      const lessonId = opts.lessonId ?? data?.lessonId;
      if (!lessonId) throw new Error(`${opts.name} requires lessonId`);
      return {
        name: opts.name,
        ...base,
        lessonId,
        data: { lessonId, ...data },
      };
    }
    case "quiz_answered": {
      const data = opts.data as QuizAnsweredData;
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("quiz_answered requires active lessonId");
      return { name: "quiz_answered", ...base, lessonId, data };
    }
    case "quiz_completed": {
      const data = opts.data as QuizCompletedData;
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("quiz_completed requires active lessonId");
      return { name: "quiz_completed", ...base, lessonId, data };
    }
    case "interaction":
      return {
        name: "interaction",
        ...base,
        lessonId: opts.lessonId,
        data: opts.data as InteractionData | undefined,
      };
    default:
      return { name: opts.name, ...base } as TelemetryEvent;
  }
}

/**
 * Like `buildTrackEvent`, but returns null (with a dev warning) when quiz events lack an active lesson.
 */
export function tryBuildTrackEvent(opts: Parameters<typeof buildTrackEvent>[0]): TelemetryEvent | null {
  const isQuiz =
    opts.name === "quiz_answered" || opts.name === "quiz_completed";
  if (isQuiz && !opts.lessonId) {
    if (isDevEnvironment() && !warnedMissingQuizLesson) {
      warnedMissingQuizLesson = true;
      console.warn(
        `[lessonkit] ${opts.name} skipped: wrap <Quiz> in <Lesson> so an active lessonId is available`,
      );
    }
    return null;
  }
  return buildTrackEvent(opts);
}
