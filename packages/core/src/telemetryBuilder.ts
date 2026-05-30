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
} from "./telemetryTypes";
import { nowIso } from "./time";

export type BuildTelemetryEventInput = {
  name: TelemetryEventName;
  courseId: CourseId;
  lessonId?: LessonId;
  sessionId?: string;
  attemptId?: string;
  user?: TelemetryUser;
  data?: unknown;
  timestamp?: string;
};

let warnedMissingQuizLesson = false;

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { NODE_ENV?: string } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

/** Reset dev-warning state (tests only). */
export function resetTelemetryBuilderWarningsForTests(): void {
  warnedMissingQuizLesson = false;
}

/**
 * Build a typed telemetry event from a catalog event name and context.
 * Validates lesson-scoped events require `lessonId`.
 */
export function buildTelemetryEvent(opts: BuildTelemetryEventInput): TelemetryEvent {
  const base = {
    timestamp: opts.timestamp ?? nowIso(),
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
        data: { ...data, lessonId },
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
        data: { ...data, lessonId },
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
 * Like `buildTelemetryEvent`, but returns null (with a dev warning) when quiz events lack an active lesson.
 */
export function tryBuildTelemetryEvent(opts: BuildTelemetryEventInput): TelemetryEvent | null {
  const isQuiz = opts.name === "quiz_answered" || opts.name === "quiz_completed";
  if (isQuiz && !opts.lessonId) {
    if (isDevEnvironment() && !warnedMissingQuizLesson) {
      warnedMissingQuizLesson = true;
      console.warn(
        `[lessonkit] ${opts.name} skipped: wrap <Quiz> in <Lesson> so an active lessonId is available`,
      );
    }
    return null;
  }
  return buildTelemetryEvent(opts);
}
