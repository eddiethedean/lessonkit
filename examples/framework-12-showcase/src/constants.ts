import type { ShowcaseMeta } from "../../_shared/showcase/types";

export const COURSE_ID = "framework-12-showcase";

export const LESSONS = [
  {
    id: "orientation",
    title: "Orientation",
    duration: "3 min",
    type: "Overview",
    blocks: ["Scenario", "Text", "Heading", "Image"],
  },
  {
    id: "platform-tour",
    title: "Platform tour",
    duration: "6 min",
    type: "Interactive",
    blocks: ["Heading", "Accordion", "DialogCards", "Flashcards", "ImageHotspots", "ImageSlider"],
  },
  {
    id: "analyst-handbook",
    title: "Analyst handbook",
    duration: "5 min",
    type: "Handbook",
    blocks: ["Heading", "InteractiveBook", "Page", "Accordion", "TrueFalse"],
  },
  {
    id: "certification",
    title: "Certification lab",
    duration: "8 min",
    type: "Assessment",
    blocks: [
      "Heading",
      "AssessmentSequence",
      "TrueFalse",
      "FillInTheBlanks",
      "MarkTheWords",
      "DragTheWords",
      "DragAndDrop",
      "FindHotspot",
      "FindMultipleHotspots",
    ],
  },
] as const;

export type LessonId = (typeof LESSONS)[number]["id"];

/** Shared hotspot map used by ImageHotspots and Find* assessments. */
export const WORKSPACE_MAP = {
  src: "/images/workspace-map.svg",
  alt: "Atlas workspace map with labeled regions",
} as const;

export const SHOWCASE_META: Omit<ShowcaseMeta, "courseConfig"> = {
  courseId: COURSE_ID,
  courseTitle: "Atlas Analytics — LessonKit 1.2 Showcase",
  topbarTitle: "Atlas Analytics",
  subtitle: "LessonKit 1.2 · Complete block catalog demo",
  sidebarTitle: "1.2 catalog",
  estimate: "~22 min",
  frameworkChip: "Framework 1.2",
  secondaryChip: "All new blocks",
  themeClassName: "",
  lessons: LESSONS,
  sibling: {
    label: "Framework 1.1 showcase",
    npmCommand: "npm -w lessonkit-example-framework-11-showcase run dev",
  },
};
