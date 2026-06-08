import type {
  AssessmentPlugin,
  LessonkitPlugin,
  LifecyclePlugin,
  TelemetryPlugin,
} from "./types";

/**
 * Identity helper for telemetry plugins; does not validate or register at import time.
 *
 * @example
 * ```ts
 * import { defineTelemetryPlugin } from "@lessonkit/core";
 *
 * const analytics = defineTelemetryPlugin({
 *   id: "console-analytics",
 *   kind: "telemetry",
 *   onEvent(event) {
 *     console.log(event.name);
 *   },
 * });
 * ```
 */
export function defineTelemetryPlugin(plugin: TelemetryPlugin): LessonkitPlugin {
  return plugin;
}

/**
 * Identity helper for assessment plugins; does not validate or register at import time.
 *
 * @example
 * ```ts
 * import { defineAssessmentPlugin } from "@lessonkit/core";
 *
 * const grader = defineAssessmentPlugin({
 *   id: "essay-grader",
 *   kind: "assessment",
 *   score(input) {
 *     return { score: input.rawScore ?? 0, maxScore: 1, passed: true };
 *   },
 * });
 * ```
 */
export function defineAssessmentPlugin(plugin: AssessmentPlugin): LessonkitPlugin {
  return plugin;
}

/**
 * Identity helper for lifecycle plugins; does not validate or register at import time.
 *
 * @example
 * ```ts
 * import { defineLifecyclePlugin } from "@lessonkit/core";
 *
 * const onComplete = defineLifecyclePlugin({
 *   id: "completion-hook",
 *   kind: "lifecycle",
 *   onCourseCompleted() {
 *     window.parent.postMessage({ type: "course-done" }, "*");
 *   },
 * });
 * ```
 */
export function defineLifecyclePlugin(plugin: LifecyclePlugin): LessonkitPlugin {
  return plugin;
}
