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
  StudioTrueFalseBlock,
  StudioFillInTheBlanksBlock,
  StudioMarkTheWordsBlock,
  StudioDragTheWordsBlock,
  StudioDragAndDropBlock,
  StudioPageBlock,
  StudioInteractiveBookBlock,
  StudioAssessmentSequenceBlock,
  StudioAccordionBlock,
  StudioDialogCardsBlock,
  StudioFlashcardsBlock,
  StudioImageHotspotsBlock,
  StudioImageSliderBlock,
  StudioFindHotspotBlock,
  StudioFindMultipleHotspotsBlock,
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
export { walkBlocks, getChildBlockLists, forEachBlock } from "./blockGraph";
export {
  BLOCK_TYPES,
  STUDIO_BLOCK_REGISTRY,
  getAssessmentKindForBlockType,
  getBlockRegistryEntry,
  isAssessmentBlockType,
  type AssessmentKind,
  type StudioBlockRegistryEntry,
  type StudioBlockType,
} from "./blockRegistry";
export type { StudioBlockPropMapping } from "./propMapping";
