import type { TelemetryEvent } from "@lessonkit/core";
import { buildLessonkitUrn } from "@lessonkit/core";
import type { XAPIStatement } from "./types";
import { cryptoRandomId } from "./id";
import { formatDurationMs } from "./duration";

const XAPIVerbs = {
  initialized: "http://adlnet.gov/expapi/verbs/initialized",
  completed: "http://adlnet.gov/expapi/verbs/completed",
  answered: "http://adlnet.gov/expapi/verbs/answered",
  experienced: "http://adlnet.gov/expapi/verbs/experienced",
} as const;

/**
 * Map a LessonKit telemetry event to an xAPI statement, or null if the event should not emit xAPI.
 * `lesson_time_on_task` returns null (companion metric; lesson_completed carries duration).
 */
export function telemetryEventToXAPIStatement(event: TelemetryEvent): XAPIStatement | null {
  const { courseId } = event;

  switch (event.name) {
    case "course_started":
      return statementFor(buildLessonkitUrn({ courseId }), XAPIVerbs.initialized, event.timestamp);
    case "course_completed":
      return statementFor(buildLessonkitUrn({ courseId }), XAPIVerbs.completed, event.timestamp);
    case "lesson_started": {
      const lessonId = event.lessonId;
      return statementFor(
        buildLessonkitUrn({ courseId, lessonId }),
        XAPIVerbs.initialized,
        event.timestamp,
      );
    }
    case "lesson_completed": {
      const lessonId = event.lessonId;
      const data = event.data;
      const result: Record<string, unknown> = {};
      if (typeof data?.durationMs === "number") {
        result.duration = formatDurationMs(data.durationMs);
      }
      if (typeof data?.success === "boolean") result.success = data.success;
      if (typeof data?.score === "number" || typeof data?.maxScore === "number") {
        const max = typeof data.maxScore === "number" ? data.maxScore : undefined;
        const raw = typeof data.score === "number" ? data.score : undefined;
        result.score = {
          raw,
          max,
          min: 0,
          scaled:
            typeof raw === "number" && typeof max === "number" && max > 0 ? raw / max : undefined,
        };
      }
      return statementFor(buildLessonkitUrn({ courseId, lessonId }), XAPIVerbs.completed, event.timestamp, {
        result: Object.keys(result).length ? result : undefined,
      });
    }
    case "lesson_time_on_task":
      return null;
    case "quiz_answered": {
      const lessonId = event.lessonId;
      const checkId = event.data.checkId;
      const result: Record<string, unknown> = {};
      if (typeof event.data.correct === "boolean") {
        result.success = event.data.correct;
      }
      return statementFor(
        buildLessonkitUrn({ courseId, lessonId, checkId }),
        XAPIVerbs.answered,
        event.timestamp,
        { result: Object.keys(result).length ? result : undefined },
      );
    }
    case "quiz_completed": {
      const lessonId = event.lessonId;
      const checkId = event.data.checkId;
      const { score, maxScore } = event.data;
      const result: Record<string, unknown> = {};
      if (typeof score === "number" || typeof maxScore === "number") {
        const max = typeof maxScore === "number" ? maxScore : undefined;
        const raw = typeof score === "number" ? score : undefined;
        result.score = {
          raw,
          max,
          min: 0,
          scaled:
            typeof raw === "number" && typeof max === "number" && max > 0 ? raw / max : undefined,
        };
      }
      return statementFor(
        buildLessonkitUrn({ courseId, lessonId, checkId }),
        XAPIVerbs.completed,
        event.timestamp,
        { result: Object.keys(result).length ? result : undefined },
      );
    }
    case "interaction": {
      const lessonId = event.lessonId;
      const blockId = event.data?.blockId;
      if (!lessonId || !blockId) return null;
      return statementFor(
        buildLessonkitUrn({ courseId, lessonId, blockId }),
        XAPIVerbs.experienced,
        event.timestamp,
      );
    }
    default:
      return null;
  }
}

function statementFor(
  objectId: string,
  verb: string,
  timestamp: string,
  extra?: Pick<XAPIStatement, "result" | "context">,
): XAPIStatement {
  return {
    id: cryptoRandomId(),
    timestamp,
    verb,
    object: { id: objectId },
    result: extra?.result,
    context: extra?.context,
  };
}
