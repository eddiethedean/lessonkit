import type { ShowcaseMeta } from "../../_shared/showcase/types";

export const COURSE_ID = "framework-11-showcase";

export const LESSONS = [
  {
    id: "shift-briefing",
    title: "Shift briefing",
    duration: "4 min",
    type: "Foundation",
    blocks: ["Scenario", "Reflection", "Quiz"],
  },
  {
    id: "signal-triage",
    title: "Signal triage",
    duration: "5 min",
    type: "Assessment",
    blocks: ["TrueFalse", "MarkTheWords", "KnowledgeCheck"],
  },
  {
    id: "containment-drills",
    title: "Containment drills",
    duration: "6 min",
    type: "Drills",
    blocks: ["FillInTheBlanks", "DragTheWords", "DragAndDrop"],
  },
  {
    id: "certification-set",
    title: "Certification set",
    duration: "7 min",
    type: "Question set",
    blocks: ["AssessmentSequence", "TrueFalse", "FillInTheBlanks", "MarkTheWords", "DragTheWords", "DragAndDrop"],
  },
] as const;

/** Injectable assessment checkIds declared in lessonkit.json (packaging parity). */
export const ASSESSMENT_CHECK_IDS = [
  "briefing-quiz",
  "verify-kc",
  "signal-tf",
  "cert-tf",
] as const;

export type LessonId = (typeof LESSONS)[number]["id"];

export const SHOWCASE_META: Omit<ShowcaseMeta, "courseConfig"> = {
  courseId: COURSE_ID,
  courseTitle: "Incident Response — LessonKit 1.1 Showcase",
  topbarTitle: "Incident Response",
  subtitle: "LessonKit 1.1 · Foundation + P0 assessment blocks",
  sidebarTitle: "1.1 catalog",
  estimate: "~22 min",
  frameworkChip: "Framework 1.1",
  secondaryChip: "Block catalog v2",
  themeClassName: "lms-theme-showcase--v11",
  lessons: LESSONS,
  sibling: {
    label: "Framework 1.2 showcase",
    npmCommand: "npm -w lessonkit-example-framework-12-showcase run dev",
  },
};
