import type { TelemetryEvent } from "./telemetryTypes";
import { isDevEnvironment } from "./internal/env";
import {
  buildTelemetryEventFromRegistry,
  getTelemetryEventRegistryEntry,
} from "./telemetry/eventRegistry";
import type { BuildTelemetryEventContext, BuildTelemetryEventInput } from "./telemetry/buildInput";

export type { BuildTelemetryEventContext, BuildTelemetryEventInput };

let warnedMissingQuizLesson = false;
let warnedMissingAssessmentLesson = false;

/** Reset dev-warning state (tests only). */
export function resetTelemetryBuilderWarningsForTests(): void {
  warnedMissingQuizLesson = false;
  warnedMissingAssessmentLesson = false;
}

/**
 * Build a typed telemetry event from a catalog event name and context.
 * Validates lesson-scoped events require `lessonId`.
 *
 * @example
 * ```ts
 * import { buildTelemetryEvent } from "@lessonkit/core";
 *
 * const event = buildTelemetryEvent({
 *   name: "lesson_completed",
 *   courseId: "sec-101",
 *   lessonId: "phishing-101",
 *   sessionId: "tab-abc",
 * });
 * ```
 */
export function buildTelemetryEvent(opts: BuildTelemetryEventInput): TelemetryEvent {
  return buildTelemetryEventFromRegistry(opts);
}

/**
 * Like `buildTelemetryEvent`, but returns null when lesson-scoped events lack `lessonId`
 * (with dev warnings for quiz/assessment events).
 */
export function tryBuildTelemetryEvent(opts: BuildTelemetryEventInput): TelemetryEvent | null {
  const entry = getTelemetryEventRegistryEntry(opts.name);
  if (entry.requiresLessonId && !opts.lessonId) {
    if (isDevEnvironment() && entry.tryBuildMissingLessonWarning) {
      if (entry.tryBuildMissingLessonWarning === "quiz" && !warnedMissingQuizLesson) {
        warnedMissingQuizLesson = true;
        console.warn(
          `[lessonkit] ${opts.name} skipped: wrap <Quiz> in <Lesson> so an active lessonId is available`,
        );
      }
      if (entry.tryBuildMissingLessonWarning === "assessment" && !warnedMissingAssessmentLesson) {
        warnedMissingAssessmentLesson = true;
        console.warn(
          `[lessonkit] ${opts.name} skipped: wrap assessment blocks in <Lesson> so an active lessonId is available`,
        );
      }
    }
    return null;
  }
  return buildTelemetryEvent(opts);
}
