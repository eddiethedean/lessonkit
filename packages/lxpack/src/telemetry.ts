import type {
  InteractionData,
  QuizAnsweredData,
  QuizCompletedData,
  TelemetryEvent,
} from "@lessonkit/core";
import type { LessonkitTelemetryEvent, LessonkitTelemetryEventName } from "@lxpack/tracking-schema";
import { LESSONKIT_TELEMETRY_EVENTS } from "@lxpack/tracking-schema";

const SUPPORTED = new Set<string>(LESSONKIT_TELEMETRY_EVENTS);

function isQuizAnsweredData(data: unknown): data is QuizAnsweredData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as QuizAnsweredData).checkId === "string"
  );
}

function isQuizCompletedData(data: unknown): data is QuizCompletedData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as QuizCompletedData).checkId === "string"
  );
}

function isInteractionData(data: unknown): data is InteractionData {
  return typeof data === "object" && data !== null;
}

/**
 * Map a `@lessonkit/core` telemetry event to the LXPack LessonKit telemetry shape.
 */
export function telemetryEventToLessonkit(
  event: TelemetryEvent,
): LessonkitTelemetryEvent | null {
  if (!SUPPORTED.has(event.name)) {
    return null;
  }

  const name = event.name as LessonkitTelemetryEventName;
  const mapped: LessonkitTelemetryEvent = {
    name,
    lessonId: event.lessonId,
  };

  if (name === "quiz_completed" || name === "quiz_answered") {
    const data = event.data;
    if (isQuizAnsweredData(data) || isQuizCompletedData(data)) {
      mapped.assessmentId = data.checkId;
      if ("score" in data) {
        mapped.score = data.score;
        mapped.maxScore = data.maxScore;
        mapped.passingScore = data.passingScore;
      }
      mapped.data = data;
    }
  } else if (name === "interaction" && event.data && isInteractionData(event.data)) {
    mapped.data = event.data;
  }

  return mapped;
}
