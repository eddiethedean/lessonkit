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
  | StudioVideoBlock;

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
