import type { BlockId, CheckId, CourseId, LessonId } from "@lessonkit/core";

export const studioSchemaVersion = 1 as const;
export const maxContainerNestingDepth = 8;

export type StudioSchemaVersion = typeof studioSchemaVersion;

export type StudioCourseMeta = {
  courseId: CourseId;
  title: string;
};

export type StudioTextBlock = {
  type: "text";
  id: string;
  text: string;
};

export type StudioHeadingBlock = {
  type: "heading";
  id: string;
  level: 1 | 2 | 3;
  text: string;
};

export type StudioImageBlock = {
  type: "image";
  id: string;
  src: string;
  alt: string;
};

export type StudioButtonBlock = {
  type: "button";
  id: string;
  label: string;
  href?: string;
};

export type StudioInputBlock = {
  type: "input";
  id: string;
  label: string;
  inputType?: "text" | "email" | "number";
  placeholder?: string;
};

export type StudioContainerBlock = {
  type: "container";
  id: string;
  blocks: StudioBlock[];
};

export type StudioQuizBlock = {
  type: "quiz";
  id: string;
  checkId: CheckId;
  question: string;
  choices: string[];
  answer: string;
};

export type StudioScenarioBlock = {
  type: "scenario";
  id: string;
  blockId?: BlockId;
  blocks: StudioBlock[];
};

export type StudioChecklistBlock = {
  type: "checklist";
  id: string;
  items: string[];
};

export type StudioVideoBlock = {
  type: "video";
  id: string;
  src: string;
  title?: string;
};

export type StudioTrueFalseBlock = {
  type: "trueFalse";
  id: string;
  checkId: CheckId;
  question: string;
  answer: boolean;
};

export type StudioFillInBlankSpec = { id: string; answer: string };

export type StudioFillInTheBlanksBlock = {
  type: "fillInTheBlanks";
  id: string;
  checkId: CheckId;
  template: string;
  blanks?: StudioFillInBlankSpec[];
};

export type StudioMarkTheWordsBlock = {
  type: "markTheWords";
  id: string;
  checkId: CheckId;
  text: string;
  correctWords: string[];
};

export type StudioDragTheWordsBlock = {
  type: "dragTheWords";
  id: string;
  checkId: CheckId;
  template: string;
  words: string[];
};

export type StudioDragItem = { id: string; label: string };
export type StudioDropTarget = { id: string; label: string; accepts: string };

export type StudioDragAndDropBlock = {
  type: "dragAndDrop";
  id: string;
  checkId: CheckId;
  items: StudioDragItem[];
  targets: StudioDropTarget[];
};

export type StudioPageBlock = {
  type: "page";
  id: string;
  blockId: BlockId;
  title?: string;
  blocks: StudioBlock[];
};

export type StudioInteractiveBookBlock = {
  type: "interactiveBook";
  id: string;
  blockId: BlockId;
  title: string;
  pages: StudioPageBlock[];
  showBookScore?: boolean;
};

export type StudioAssessmentSequenceBlock = {
  type: "assessmentSequence";
  id: string;
  blockId?: BlockId;
  sequential?: boolean;
  blocks: StudioBlock[];
};

export type StudioAccordionSection = {
  id: string;
  title: string;
  blocks: StudioBlock[];
};

export type StudioAccordionBlock = {
  type: "accordion";
  id: string;
  blockId: BlockId;
  sections: StudioAccordionSection[];
};

export type StudioDialogCard = { front: string; back: string };

export type StudioDialogCardsBlock = {
  type: "dialogCards";
  id: string;
  blockId: BlockId;
  cards: StudioDialogCard[];
};

export type StudioFlashcard = { front: string; back: string };

export type StudioFlashcardsBlock = {
  type: "flashcards";
  id: string;
  blockId: BlockId;
  cards: StudioFlashcard[];
  selfScore?: boolean;
};

export type StudioHotspotSpec = {
  id: string;
  label: string;
  x: number;
  y: number;
  blocks: StudioBlock[];
};

export type StudioImageHotspotsBlock = {
  type: "imageHotspots";
  id: string;
  blockId: BlockId;
  src: string;
  alt: string;
  hotspots: StudioHotspotSpec[];
};

export type StudioImageSlide = { src: string; alt: string; caption?: string };

export type StudioImageSliderBlock = {
  type: "imageSlider";
  id: string;
  blockId: BlockId;
  slides: StudioImageSlide[];
};

export type StudioHotspotTarget = { id: string; label: string; x: number; y: number };

export type StudioFindHotspotBlock = {
  type: "findHotspot";
  id: string;
  checkId: CheckId;
  src: string;
  alt: string;
  targets: StudioHotspotTarget[];
  correctTargetId: string;
};

export type StudioFindMultipleHotspotsBlock = {
  type: "findMultipleHotspots";
  id: string;
  checkId: CheckId;
  src: string;
  alt: string;
  targets: StudioHotspotTarget[];
  correctTargetIds: string[];
};

export type StudioBlock =
  | StudioTextBlock
  | StudioHeadingBlock
  | StudioImageBlock
  | StudioButtonBlock
  | StudioInputBlock
  | StudioContainerBlock
  | StudioQuizBlock
  | StudioScenarioBlock
  | StudioChecklistBlock
  | StudioVideoBlock
  | StudioTrueFalseBlock
  | StudioFillInTheBlanksBlock
  | StudioMarkTheWordsBlock
  | StudioDragTheWordsBlock
  | StudioDragAndDropBlock
  | StudioPageBlock
  | StudioInteractiveBookBlock
  | StudioAssessmentSequenceBlock
  | StudioAccordionBlock
  | StudioDialogCardsBlock
  | StudioFlashcardsBlock
  | StudioImageHotspotsBlock
  | StudioImageSliderBlock
  | StudioFindHotspotBlock
  | StudioFindMultipleHotspotsBlock;

export type StudioPage = {
  id: LessonId;
  title: string;
  blocks: StudioBlock[];
};

export type StudioProjectV1 = {
  schemaVersion: StudioSchemaVersion;
  course: StudioCourseMeta;
  pages: StudioPage[];
};

export type StudioValidationIssue = {
  path: string;
  message: string;
};

export type ParseStudioProjectResult =
  | { ok: true; project: StudioProjectV1 }
  | { ok: false; issues: StudioValidationIssue[] };

export type ValidateStudioProjectResult =
  | { ok: true }
  | { ok: false; issues: StudioValidationIssue[] };

export type MigrateStudioProjectResult = {
  doc: unknown;
  migrationsApplied: string[];
};
