import type { CheckId, CourseId, LessonId } from "@lessonkit/core";
import type { LessonkitThemeV1, ThemePresetName } from "@lessonkit/themes";

export type SpaLayout = "single-spa" | "per-lesson-spa";

export type LessonDescriptor = {
  id: LessonId;
  title: string;
  /** Built SPA folder relative to the LXPack project root (`per-lesson-spa` only). */
  spaPath?: string;
};

export type McqAssessmentDescriptor = {
  kind?: "mcq";
  checkId: CheckId;
  question: string;
  choices: string[];
  answer: string;
  passingScore?: number;
};

export type TrueFalseAssessmentDescriptor = {
  kind: "trueFalse";
  checkId: CheckId;
  question: string;
  answer: boolean;
  passingScore?: number;
};

export type FillInBlanksAssessmentDescriptor = {
  kind: "fillInBlanks";
  checkId: CheckId;
  question: string;
  template: string;
  blanks?: Array<{ id: string; answer: string }>;
  passingScore?: number;
};

/** Discriminated assessment entries in lessonkit.json (defaults to MCQ when kind omitted). */
export type AssessmentDescriptor =
  | McqAssessmentDescriptor
  | TrueFalseAssessmentDescriptor
  | FillInBlanksAssessmentDescriptor;

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
    /** Required for xAPI / cmi5 export targets (`activityIri` on the course activity). */
    xapi?: {
      activityIri?: string;
    };
  };
  /** Source Vite `dist` directory for `single-spa` (default: `dist`). */
  spaDistDir?: string;
  /** LXPack SPA lesson id for `single-spa` (default: first lesson id or `main`). */
  spaLessonId?: string;
};

export type { LessonkitInterchangeV1 } from "@lxpack/validators";

export type MappedLessonkitIds = {
  courseId: CourseId;
  lessonIds: LessonId[];
  checkIds: CheckId[];
};
