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
} from "./plugins/index.js";

export {
  createPluginRegistry,
  defineAssessmentPlugin,
  defineLifecyclePlugin,
  defineTelemetryPlugin,
} from "./plugins/index.js";
