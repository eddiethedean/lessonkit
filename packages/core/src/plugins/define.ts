import type {
  AssessmentPlugin,
  LessonkitPlugin,
  LifecyclePlugin,
  TelemetryPlugin,
} from "./types";

export function defineTelemetryPlugin(plugin: TelemetryPlugin): LessonkitPlugin {
  return plugin;
}

export function defineAssessmentPlugin(plugin: AssessmentPlugin): LessonkitPlugin {
  return plugin;
}

export function defineLifecyclePlugin(plugin: LifecyclePlugin): LessonkitPlugin {
  return plugin;
}

/** @deprecated Prefer `defineTelemetryPlugin`, `defineAssessmentPlugin`, or `defineLifecyclePlugin`. */
export function defineLessonkitPlugin(plugin: LessonkitPlugin): LessonkitPlugin {
  return plugin;
}
