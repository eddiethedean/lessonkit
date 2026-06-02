import type { LessonkitCourseDescriptor } from "@lessonkit/lxpack";
import type { ThemePresetName } from "@lessonkit/themes";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { collectQuizAssessments } from "./collectQuizzes";
import type { StudioExportOptions } from "./types";

const DEFAULT_PATHS = {
  spaDistDir: "dist",
  lxpackOutDir: ".lxpack/course",
  outputBaseDir: ".lxpack/out",
} as const;

export function defaultActivityIri(courseId: string): string {
  return `https://lessonkit.app/courses/${courseId}`;
}

export function studioProjectToDescriptor(
  project: StudioProjectV1,
  options: StudioExportOptions = {},
): LessonkitCourseDescriptor {
  const assessments = collectQuizAssessments(project);
  const firstPage = project.pages[0];
  if (!firstPage) {
    throw new Error("Project must include at least one page");
  }
  const preset: ThemePresetName = options.theme?.preset ?? "default";
  const activityIri = options.tracking?.xapi?.activityIri?.trim() || defaultActivityIri(project.course.courseId);

  return {
    courseId: project.course.courseId,
    title: project.course.title,
    layout: "single-spa",
    spaLessonId: firstPage.id,
    // single-spa lessonkit.json allows one SPA lesson entry; all pages remain in project.json.
    lessons: [{ id: firstPage.id, title: firstPage.title }],
    assessments: assessments.length ? assessments : undefined,
    theme: { preset },
    tracking: {
      ...(options.tracking?.completion?.threshold !== undefined
        ? { completion: { threshold: options.tracking.completion.threshold } }
        : {}),
      xapi: { activityIri },
    },
  };
}

export function buildLessonkitManifest(
  project: StudioProjectV1,
  options: StudioExportOptions = {},
): {
  schemaVersion: 1;
  name: string;
  course: LessonkitCourseDescriptor;
  paths: { spaDistDir: string; lxpackOutDir: string; outputBaseDir: string };
} {
  const course = studioProjectToDescriptor(project, options);
  return {
    schemaVersion: 1,
    name: project.course.courseId,
    course,
    paths: {
      spaDistDir: options.paths?.spaDistDir ?? DEFAULT_PATHS.spaDistDir,
      lxpackOutDir: options.paths?.lxpackOutDir ?? DEFAULT_PATHS.lxpackOutDir,
      outputBaseDir: options.paths?.outputBaseDir ?? DEFAULT_PATHS.outputBaseDir,
    },
  };
}
