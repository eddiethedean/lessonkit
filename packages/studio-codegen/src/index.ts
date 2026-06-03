export type {
  ExportValidationResult,
  GeneratedFile,
  PackageStudioOptions,
  StudioExportMode,
  StudioExportOptions,
  StudioExportPaths,
} from "./types";

export { collectAssessments, collectQuizAssessments, walkBlocks } from "./collectQuizzes";
export { assertExportableProject } from "./validateExport";
export {
  buildLessonkitManifest,
  defaultActivityIri,
  studioProjectToDescriptor,
} from "./toDescriptor";
export {
  generateExportFiles,
  generateReactViteFiles,
  generateReactViteJsxFiles,
} from "./generateReactVite";
export { emitAppTsx, emitBlockJsx, emitBlocksJsx } from "./emitJsx";
export { escapeJsxString, jsxStringArray, jsxStringLiteral } from "./escapeJsx";
