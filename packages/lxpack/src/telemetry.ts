import type { QuizAnsweredData, QuizCompletedData, TelemetryEvent } from "@lessonkit/core";
import type { LessonkitTelemetryEvent, LessonkitTelemetryEventName } from "@lxpack/tracking-schema";
import { LESSONKIT_TELEMETRY_EVENTS } from "@lxpack/tracking-schema";

const SUPPORTED = new Set<string>(LESSONKIT_TELEMETRY_EVENTS);

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
    const data = event.data as QuizCompletedData | QuizAnsweredData | undefined;
    mapped.assessmentId = data?.checkId;
    if (data && "score" in data) {
      mapped.score = data.score;
      mapped.maxScore = data.maxScore;
      mapped.passingScore = data.passingScore;
    }
    if (data) {
      mapped.data = data as Record<string, unknown>;
    }
  } else if (name === "interaction" && event.data) {
    mapped.data = event.data as Record<string, unknown>;
  }

  return mapped;
}
