/** Canonical compound child allowlists (H5P sub-content curation). */

export const PAGE_ALLOWED_CHILD_TYPES = [
  "Text",
  "Heading",
  "Image",
  "Scenario",
  "Reflection",
  "Quiz",
  "KnowledgeCheck",
  "TrueFalse",
  "FillInTheBlanks",
  "DragAndDrop",
  "DragTheWords",
  "MarkTheWords",
  "Accordion",
  "DialogCards",
  "Flashcards",
  "ImageHotspots",
  "FindHotspot",
  "FindMultipleHotspots",
  "ImageSlider",
  "ProgressTracker",
] as const;

export const INTERACTIVE_BOOK_ALLOWED_CHILD_TYPES = ["Page"] as const;

/** Per-slide content (H5P Course Presentation slide row). Excludes ProgressTracker. */
export const SLIDE_ALLOWED_CHILD_TYPES = [
  "Text",
  "Heading",
  "Image",
  "Scenario",
  "Reflection",
  "Quiz",
  "KnowledgeCheck",
  "TrueFalse",
  "FillInTheBlanks",
  "DragAndDrop",
  "DragTheWords",
  "MarkTheWords",
  "Accordion",
  "DialogCards",
  "Flashcards",
  "ImageHotspots",
  "FindHotspot",
  "FindMultipleHotspots",
  "ImageSlider",
] as const;

export const SLIDE_DECK_ALLOWED_CHILD_TYPES = ["Slide"] as const;

export const ASSESSMENT_SEQUENCE_ALLOWED_CHILD_TYPES = [
  "TrueFalse",
  "FillInTheBlanks",
  "DragAndDrop",
  "DragTheWords",
  "MarkTheWords",
  "Quiz",
  "KnowledgeCheck",
  "FindHotspot",
  "FindMultipleHotspots",
] as const;

export type CompoundParentType =
  | "Page"
  | "InteractiveBook"
  | "Slide"
  | "SlideDeck"
  | "AssessmentSequence";

const ALLOWLISTS: Record<CompoundParentType, readonly string[]> = {
  Page: PAGE_ALLOWED_CHILD_TYPES,
  InteractiveBook: INTERACTIVE_BOOK_ALLOWED_CHILD_TYPES,
  Slide: SLIDE_ALLOWED_CHILD_TYPES,
  SlideDeck: SLIDE_DECK_ALLOWED_CHILD_TYPES,
  AssessmentSequence: ASSESSMENT_SEQUENCE_ALLOWED_CHILD_TYPES,
};

export const COMPOUND_MAX_NESTING_DEPTH: Record<CompoundParentType, number> = {
  Page: 1,
  InteractiveBook: 2,
  Slide: 1,
  SlideDeck: 2,
  AssessmentSequence: 1,
};

export function getAllowedChildTypes(parent: CompoundParentType): readonly string[] {
  return ALLOWLISTS[parent];
}

export function isChildTypeAllowed(parent: CompoundParentType, childType: string): boolean {
  return ALLOWLISTS[parent].includes(childType);
}

/** Blocks that must not nest inside Accordion (policy: no accordion-in-accordion). */
export const ACCORDION_FORBIDDEN_CHILD_TYPES = ["Accordion"] as const;
