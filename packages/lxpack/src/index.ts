export type {
  AssessmentDescriptor,
  LessonDescriptor,
  LessonkitCourseDescriptor,
  LessonkitInterchangeV1,
  MappedLessonkitIds,
  SpaLayout,
} from "./types";

export type { DescriptorValidationIssue, DescriptorValidationResult } from "./validateDescriptor";
export { validateDescriptor, validateDescriptorForTarget } from "./validateDescriptor";
export type { ValidationIssue } from "./validationIssue";
export type { ProjectPathsInput } from "./validateProjectPaths";
export {
  resolveSafePackageOutputOverride,
  validateProjectPaths,
} from "./validateProjectPaths";

export { mapLessonkitIds } from "./mapIds";

export type { LxpackRuntimeTheme } from "./theme";
export { themeToLxpackRuntime } from "./theme";

export type { SpaLessonEntry } from "./interchange";
export { descriptorToInterchange, resolveSpaLessons } from "./interchange";

export type { LxpackInjectedAssessment } from "./assessments";
export { assessmentDescriptorToLxpack, extractAssessments } from "./assessments";

export type { WriteLxpackProjectOptions, WriteLxpackProjectResult } from "./writeProject";
export { writeLxpackProject } from "./writeProject";

export type {
  BuildLessonkitProjectOptions,
  PackageLessonkitCourseOptions,
  PackageLessonkitCourseResult,
  ValidateLessonkitProjectOptions,
} from "./packageCourse";
export {
  buildLessonkitProject,
  packageLessonkitCourse,
  validateLessonkitProject,
} from "./packageCourse";

export type { ExportTarget } from "./packageCourse";

export {
  remapArtifactPaths,
  validatePackageInputs,
  type PackageValidationIssue,
  type ValidatePackageInputsResult,
} from "./packaging/validateInputs";

export { promoteStagingToOutDir } from "./packaging/promote";
export {
  buildStagingPackage,
  ensureOutDirParent,
  type BuildStagingPackageOptions,
  type BuildStagingPackageResult,
} from "./packaging/staging";

export type {
  LessonkitManifest,
  LessonkitManifestPaths,
  ManifestParseIssue,
  ParseManifestResult,
} from "./manifest";
export { loadLessonkitManifestFromFile, parseLessonkitManifest } from "./manifest";

export type {
  LessonkitBridgeAction,
  LessonkitTelemetryEvent,
  LessonkitTelemetryEventName,
  TrackingSchemaEvent,
} from "@lxpack/tracking-schema";
export {
  LESSONKIT_TELEMETRY_EVENTS,
  mapLessonkitTelemetryToBridgeAction,
  mapLessonkitTelemetryToLxpack,
} from "@lxpack/tracking-schema";
export { telemetryEventToLessonkit } from "./telemetry";

export type { MaterializeLessonkitOptions, MaterializeLessonkitResult } from "@lxpack/validators";
export {
  lessonkitInterchangeSchema,
  materializeLessonkitProject,
  parseLessonkitInterchange,
} from "@lxpack/validators";
