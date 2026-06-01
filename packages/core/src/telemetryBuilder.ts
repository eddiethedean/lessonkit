import { assertNever } from "./assertNever";
import type {
  CourseId,
  InteractionData,
  LessonId,
  LessonLifecycleData,
  QuizAnsweredData,
  QuizCompletedData,
  TelemetryEvent,
  TelemetryUser,
} from "./telemetryTypes";
import { nowIso } from "./time";

export type BuildTelemetryEventContext = {
  courseId: CourseId;
  sessionId?: string;
  attemptId?: string;
  user?: TelemetryUser;
  timestamp?: string;
};

export type BuildTelemetryEventInput =
  | (BuildTelemetryEventContext & { name: "course_started"; lessonId?: LessonId; data?: undefined })
  | (BuildTelemetryEventContext & { name: "course_completed"; lessonId?: LessonId; data?: undefined })
  | (BuildTelemetryEventContext & {
      name: "lesson_started";
      lessonId?: LessonId;
      data?: LessonLifecycleData;
    })
  | (BuildTelemetryEventContext & {
      name: "lesson_completed";
      lessonId?: LessonId;
      data?: LessonLifecycleData;
    })
  | (BuildTelemetryEventContext & {
      name: "lesson_time_on_task";
      lessonId?: LessonId;
      data?: LessonLifecycleData;
    })
  | (BuildTelemetryEventContext & {
      name: "quiz_answered";
      lessonId?: LessonId;
      data: QuizAnsweredData;
    })
  | (BuildTelemetryEventContext & {
      name: "quiz_completed";
      lessonId?: LessonId;
      data: QuizCompletedData;
    })
  | (BuildTelemetryEventContext & {
      name: "interaction";
      lessonId?: LessonId;
      data?: InteractionData;
    });

let warnedMissingQuizLesson = false;

function isDevEnvironment(): boolean {
  const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
  return typeof g.process !== "undefined" && g.process.env?.NODE_ENV !== "production";
}

/** Reset dev-warning state (tests only). */
export function resetTelemetryBuilderWarningsForTests(): void {
  warnedMissingQuizLesson = false;
}

function resolveLessonId(
  opts: { lessonId?: LessonId; data?: LessonLifecycleData },
  eventName: string,
): LessonId {
  const lessonId = opts.lessonId ?? opts.data?.lessonId;
  if (!lessonId) throw new Error(`${eventName} requires lessonId`);
  return lessonId;
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
      const lessonId = resolveLessonId(opts, "lesson_started");
      return {
        name: "lesson_started",
        ...base,
        lessonId,
        data: { ...opts.data, lessonId },
      };
    }
    case "lesson_completed":
    case "lesson_time_on_task": {
      const lessonId = resolveLessonId(opts, opts.name);
      return {
        name: opts.name,
        ...base,
        lessonId,
        data: { ...opts.data, lessonId },
      };
    }
    case "quiz_answered": {
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("quiz_answered requires active lessonId");
      return { name: "quiz_answered", ...base, lessonId, data: opts.data };
    }
    case "quiz_completed": {
      const lessonId = opts.lessonId;
      if (!lessonId) throw new Error("quiz_completed requires active lessonId");
      return { name: "quiz_completed", ...base, lessonId, data: opts.data };
    }
    case "interaction":
      return {
        name: "interaction",
        ...base,
        lessonId: opts.lessonId,
        data: opts.data,
      };
    default:
      return assertNever(opts);
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
