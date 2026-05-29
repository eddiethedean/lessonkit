export type {
  AssessmentDescriptor,
  LessonDescriptor,
  LessonkitCourseDescriptor,
  LessonkitInterchangeV1,
  MappedLessonkitIds,
  SpaLayout,
} from "./types";

export type { DescriptorValidationIssue, DescriptorValidationResult } from "./validateDescriptor";
export { validateDescriptor } from "./validateDescriptor";
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
