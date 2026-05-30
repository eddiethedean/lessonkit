export type {
  AssessmentPlugin,
  AssessmentScoreInput,
  AssessmentScoreResult,
  InteractionBlockRegistration,
  InteractionPlugin,
  LessonkitPlugin,
  LessonkitPluginContext,
  LessonkitPluginKind,
  LifecyclePlugin,
  PluginHost,
  PluginIdentity,
  PluginRegistry,
  TelemetryPlugin,
} from "./types";

export { createPluginRegistry, createPluginHost, type PluginHost as PluginHostType } from "./registry";
export {
  defineAssessmentPlugin,
  defineLifecyclePlugin,
  defineLessonkitPlugin,
  defineTelemetryPlugin,
} from "./define";
