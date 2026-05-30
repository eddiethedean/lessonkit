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

export { createPluginRegistry, type PluginHost as PluginHostType } from "./registry";
export {
  defineAssessmentPlugin,
  defineLifecyclePlugin,
  defineTelemetryPlugin,
} from "./define";
