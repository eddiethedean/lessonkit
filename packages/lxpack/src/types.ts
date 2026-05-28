import type { CheckId, CourseId, LessonId } from "@lessonkit/core";
import type { LessonkitThemeV1, ThemePresetName } from "@lessonkit/themes";

export type SpaLayout = "single-spa" | "per-lesson-spa";

export type LessonDescriptor = {
  id: LessonId;
  title: string;
  /** Built SPA folder relative to the LXPack project root (`per-lesson-spa` only). */
  spaPath?: string;
};

export type AssessmentDescriptor = {
  checkId: CheckId;
  question: string;
  choices: string[];
  answer: string;
  passingScore?: number;
};

export type LessonkitCourseDescriptor = {
  courseId: CourseId;
  title: string;
  version?: string;
  layout: SpaLayout;
  lessons: LessonDescriptor[];
  assessments?: AssessmentDescriptor[];
  theme?: {
    preset?: ThemePresetName;
    theme?: LessonkitThemeV1;
  };
  tracking?: {
    completion?: {
      threshold?: number;
    };
  };
  /** Source Vite `dist` directory for `single-spa` (default: `dist`). */
  spaDistDir?: string;
  /** LXPack SPA lesson id for `single-spa` (default: first lesson id or `main`). */
  spaLessonId?: string;
};

export type LessonkitInterchangeV1 = {
  format: "lessonkit";
  version: "1";
  course: {
    id: CourseId;
    title: string;
  };
  lessons: Array<{
    id: LessonId;
    title: string;
    type: "spa";
    path: string;
  }>;
  tracking?: {
    completion?: {
      threshold?: number;
    };
  };
};

export type MappedLessonkitIds = {
  courseId: CourseId;
  lessonIds: LessonId[];
  checkIds: CheckId[];
};
