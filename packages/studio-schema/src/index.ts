export { studioSchemaVersion, maxContainerNestingDepth } from "./types";
export { studioBlockCatalogVersion } from "./catalog";
export type {
  StudioProjectV1,
  StudioPage,
  StudioBlock,
  StudioCourseMeta,
  StudioTextBlock,
  StudioHeadingBlock,
  StudioImageBlock,
  StudioButtonBlock,
  StudioInputBlock,
  StudioContainerBlock,
  StudioQuizBlock,
  StudioScenarioBlock,
  StudioChecklistBlock,
  StudioVideoBlock,
  StudioValidationIssue,
  ParseStudioProjectResult,
  ValidateStudioProjectResult,
  MigrateStudioProjectResult,
} from "./types";
export type { LoadStudioProjectResult } from "./load";

export { parseStudioProject } from "./parse";
export { validateStudioProject } from "./validate";
export { normalizeStudioProject } from "./normalize";
export { migrateStudioProject } from "./migrate";
export { loadStudioProject } from "./load";
export { buildStudioBlockCatalog, type StudioBlockCatalogEntry } from "./catalog";
