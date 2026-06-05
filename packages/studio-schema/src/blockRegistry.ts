import type { AssessmentDescriptor } from "@lessonkit/lxpack";

export type StudioBlockType =
  | "text"
  | "heading"
  | "image"
  | "button"
  | "input"
  | "container"
  | "quiz"
  | "scenario"
  | "checklist"
  | "video"
  | "trueFalse"
  | "fillInTheBlanks"
  | "markTheWords"
  | "dragTheWords"
  | "dragAndDrop"
  | "page"
  | "interactiveBook"
  | "assessmentSequence"
  | "accordion"
  | "dialogCards"
  | "flashcards"
  | "imageHotspots"
  | "imageSlider"
  | "findHotspot"
  | "findMultipleHotspots";

export type AssessmentKind = NonNullable<AssessmentDescriptor["kind"]> | "mcq";

export type StudioBlockRegistryEntry = {
  type: StudioBlockType;
  /** Palette label (H5P-familiar where applicable). */
  displayName: string;
  category: "primitive" | "layout" | "learning" | "stub";
  traverseChildren: boolean;
  editorNestable: boolean;
  assessmentKind?: AssessmentKind;
};

export const STUDIO_BLOCK_REGISTRY: Record<StudioBlockType, StudioBlockRegistryEntry> = {
  text: { type: "text", displayName: "Text", category: "primitive", traverseChildren: false, editorNestable: false },
  heading: { type: "heading", displayName: "Heading", category: "primitive", traverseChildren: false, editorNestable: false },
  image: { type: "image", displayName: "Image", category: "primitive", traverseChildren: false, editorNestable: false },
  button: { type: "button", displayName: "Button", category: "primitive", traverseChildren: false, editorNestable: false },
  input: { type: "input", displayName: "Input", category: "primitive", traverseChildren: false, editorNestable: false },
  container: { type: "container", displayName: "Container", category: "layout", traverseChildren: true, editorNestable: true },
  quiz: { type: "quiz", displayName: "Quiz", category: "learning", traverseChildren: false, editorNestable: false, assessmentKind: "mcq" },
  scenario: { type: "scenario", displayName: "Scenario", category: "layout", traverseChildren: true, editorNestable: true },
  checklist: { type: "checklist", displayName: "Checklist", category: "learning", traverseChildren: false, editorNestable: false },
  video: { type: "video", displayName: "Video", category: "primitive", traverseChildren: false, editorNestable: false },
  trueFalse: { type: "trueFalse", displayName: "True/False", category: "learning", traverseChildren: false, editorNestable: false, assessmentKind: "trueFalse" },
  fillInTheBlanks: { type: "fillInTheBlanks", displayName: "Fill in the Blanks", category: "learning", traverseChildren: false, editorNestable: false, assessmentKind: "fillInBlanks" },
  markTheWords: { type: "markTheWords", displayName: "Mark the Words", category: "learning", traverseChildren: false, editorNestable: false, assessmentKind: "fillInBlanks" },
  dragTheWords: { type: "dragTheWords", displayName: "Drag the Words", category: "learning", traverseChildren: false, editorNestable: false, assessmentKind: "fillInBlanks" },
  dragAndDrop: { type: "dragAndDrop", displayName: "Drag and Drop", category: "learning", traverseChildren: false, editorNestable: false, assessmentKind: "mcq" },
  page: { type: "page", displayName: "Page", category: "layout", traverseChildren: true, editorNestable: false },
  interactiveBook: { type: "interactiveBook", displayName: "Interactive Book", category: "layout", traverseChildren: true, editorNestable: false },
  assessmentSequence: { type: "assessmentSequence", displayName: "Question Set", category: "layout", traverseChildren: true, editorNestable: false },
  accordion: { type: "accordion", displayName: "Accordion", category: "layout", traverseChildren: true, editorNestable: false },
  dialogCards: { type: "dialogCards", displayName: "Dialog Cards", category: "learning", traverseChildren: false, editorNestable: false },
  flashcards: { type: "flashcards", displayName: "Flashcards", category: "learning", traverseChildren: false, editorNestable: false },
  imageHotspots: { type: "imageHotspots", displayName: "Image Hotspots", category: "layout", traverseChildren: true, editorNestable: false },
  imageSlider: { type: "imageSlider", displayName: "Image Slider", category: "learning", traverseChildren: false, editorNestable: false },
  findHotspot: { type: "findHotspot", displayName: "Find the Hotspot", category: "learning", traverseChildren: false, editorNestable: false, assessmentKind: "findHotspot" },
  findMultipleHotspots: { type: "findMultipleHotspots", displayName: "Find Multiple Hotspots", category: "learning", traverseChildren: false, editorNestable: false, assessmentKind: "findMultipleHotspots" },
};

export const BLOCK_TYPES = Object.keys(STUDIO_BLOCK_REGISTRY) as StudioBlockType[];

export function getBlockRegistryEntry(type: string): StudioBlockRegistryEntry | undefined {
  return STUDIO_BLOCK_REGISTRY[type as StudioBlockType];
}

export function isAssessmentBlockType(type: string): type is StudioBlockType {
  return Boolean(getBlockRegistryEntry(type)?.assessmentKind);
}

export function getAssessmentKindForBlockType(type: string): AssessmentKind | undefined {
  return getBlockRegistryEntry(type)?.assessmentKind;
}
