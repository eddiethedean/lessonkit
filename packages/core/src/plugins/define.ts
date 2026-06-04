import type {
  AssessmentPlugin,
  LessonkitPlugin,
  LifecyclePlugin,
  TelemetryPlugin,
} from "./types";

/** Identity helper for telemetry plugins; does not validate or register at import time. */
export function defineTelemetryPlugin(plugin: TelemetryPlugin): LessonkitPlugin {
  return plugin;
}

/** Identity helper for assessment plugins; does not validate or register at import time. */
export function defineAssessmentPlugin(plugin: AssessmentPlugin): LessonkitPlugin {
  return plugin;
}

/** Identity helper for lifecycle plugins; does not validate or register at import time. */
export function defineLifecyclePlugin(plugin: LifecyclePlugin): LessonkitPlugin {
  return plugin;
}
