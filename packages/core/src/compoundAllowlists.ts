/** Canonical compound child allowlists (H5P sub-content curation). */

const PAGE_AND_SLIDE_14_BLOCKS = [
  "Video",
  "Summary",
  "ImagePairing",
  "ImageSequencing",
  "MemoryGame",
  "InformationWall",
  "ParallaxSlideshow",
  "Questionnaire",
  "Essay",
  "ArithmeticQuiz",
] as const;

export const PAGE_ALLOWED_CHILD_TYPES = [
  "Text",
  "Heading",
  "Image",
  "Video",
  "Scenario",
  "Reflection",
  "Quiz",
  "KnowledgeCheck",
  "TrueFalse",
  "FillInTheBlanks",
  "DragAndDrop",
  "DragTheWords",
  "MarkTheWords",
  "Summary",
  "ImagePairing",
  "ImageSequencing",
  "MemoryGame",
  "InformationWall",
  "ParallaxSlideshow",
  "Questionnaire",
  "Essay",
  "ArithmeticQuiz",
  "Accordion",
  "DialogCards",
  "Flashcards",
  "ImageHotspots",
  "FindHotspot",
  "FindMultipleHotspots",
  "ImageSlider",
  "Embed",
  "Chart",
  "ProgressTracker",
] as const;

/** Branch node content (Page-like minus ProgressTracker). */
export const BRANCH_NODE_ALLOWED_CHILD_TYPES = [
  "Text",
  "Heading",
  "Image",
  "Video",
  "Scenario",
  "Reflection",
  "Quiz",
  "KnowledgeCheck",
  "TrueFalse",
  "FillInTheBlanks",
  "DragAndDrop",
  "DragTheWords",
  "MarkTheWords",
  "Summary",
  "ImagePairing",
  "ImageSequencing",
  "MemoryGame",
  "InformationWall",
  "ParallaxSlideshow",
  "Questionnaire",
  "Essay",
  "ArithmeticQuiz",
  "Accordion",
  "DialogCards",
  "Flashcards",
  "ImageHotspots",
  "FindHotspot",
  "FindMultipleHotspots",
  "ImageSlider",
  "Embed",
  "Chart",
  "BranchChoice",
] as const;

export const BRANCHING_SCENARIO_ALLOWED_CHILD_TYPES = ["BranchNode"] as const;

export const INTERACTIVE_BOOK_ALLOWED_CHILD_TYPES = ["Page"] as const;

/** Per-slide content (H5P Course Presentation slide row). Excludes ProgressTracker. */
export const SLIDE_ALLOWED_CHILD_TYPES = [
  "Text",
  "Heading",
  "Image",
  "Video",
  "Scenario",
  "Reflection",
  "Quiz",
  "KnowledgeCheck",
  "TrueFalse",
  "FillInTheBlanks",
  "DragAndDrop",
  "DragTheWords",
  "MarkTheWords",
  "Summary",
  "ImagePairing",
  "ImageSequencing",
  "MemoryGame",
  "InformationWall",
  "ParallaxSlideshow",
  "Questionnaire",
  "Essay",
  "ArithmeticQuiz",
  "Accordion",
  "DialogCards",
  "Flashcards",
  "ImageHotspots",
  "FindHotspot",
  "FindMultipleHotspots",
  "ImageSlider",
  "Embed",
  "Chart",
] as const;

export const SLIDE_DECK_ALLOWED_CHILD_TYPES = ["Slide"] as const;

export const TIMED_CUE_ALLOWED_CHILD_TYPES = [
  "Text",
  "Heading",
  "Image",
  "Quiz",
  "TrueFalse",
  "FillInTheBlanks",
  "Summary",
  "ImagePairing",
  "ImageSequencing",
  "MemoryGame",
  "Questionnaire",
  "Essay",
  "ArithmeticQuiz",
] as const;

export const INTERACTIVE_VIDEO_ALLOWED_CHILD_TYPES = ["TimedCue"] as const;

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
  "Summary",
  "ImagePairing",
  "ImageSequencing",
  "ArithmeticQuiz",
  "Essay",
] as const;

export type CompoundParentType =
  | "Page"
  | "InteractiveBook"
  | "Slide"
  | "SlideDeck"
  | "TimedCue"
  | "InteractiveVideo"
  | "AssessmentSequence"
  | "BranchingScenario"
  | "BranchNode";

const ALLOWLISTS: Record<CompoundParentType, readonly string[]> = {
  Page: PAGE_ALLOWED_CHILD_TYPES,
  InteractiveBook: INTERACTIVE_BOOK_ALLOWED_CHILD_TYPES,
  Slide: SLIDE_ALLOWED_CHILD_TYPES,
  SlideDeck: SLIDE_DECK_ALLOWED_CHILD_TYPES,
  TimedCue: TIMED_CUE_ALLOWED_CHILD_TYPES,
  InteractiveVideo: INTERACTIVE_VIDEO_ALLOWED_CHILD_TYPES,
  AssessmentSequence: ASSESSMENT_SEQUENCE_ALLOWED_CHILD_TYPES,
  BranchingScenario: BRANCHING_SCENARIO_ALLOWED_CHILD_TYPES,
  BranchNode: BRANCH_NODE_ALLOWED_CHILD_TYPES,
};

export const COMPOUND_MAX_NESTING_DEPTH: Record<CompoundParentType, number> = {
  Page: 1,
  InteractiveBook: 2,
  Slide: 1,
  SlideDeck: 2,
  TimedCue: 1,
  InteractiveVideo: 2,
  AssessmentSequence: 1,
  BranchingScenario: 2,
  BranchNode: 1,
};

export function getAllowedChildTypes(parent: CompoundParentType): readonly string[] {
  return ALLOWLISTS[parent];
}

export function isChildTypeAllowed(parent: CompoundParentType, childType: string): boolean {
  return ALLOWLISTS[parent].includes(childType);
}

/** Blocks that must not nest inside Accordion (policy: no accordion-in-accordion). */
export const ACCORDION_FORBIDDEN_CHILD_TYPES = ["Accordion"] as const;

/** New 1.4 blocks added to Page and Slide allowlists (for docs/tests). */
export const BLOCKS_14_PAGE_SLIDE = PAGE_AND_SLIDE_14_BLOCKS;
