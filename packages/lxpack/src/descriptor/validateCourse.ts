import { validateId } from "@lessonkit/core";
import type { LessonkitThemeV1, ThemePresetName } from "@lessonkit/themes";
import type { LessonkitCourseDescriptor, SpaLayout } from "../types";
import { isSafeRelativeSpaPath } from "../spaPath";
import { themeToLxpackRuntime } from "../theme";
import type { ValidationIssue } from "../validationIssue";
import { validateAssessmentEntry } from "./validateAssessments";

const VALID_LAYOUTS: readonly SpaLayout[] = ["single-spa", "per-lesson-spa"];
const VALID_THEME_PRESETS = ["default", "light", "dark", "brand"] as const satisfies readonly ThemePresetName[];

export function validateCourseDescriptor(input: LessonkitCourseDescriptor): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const course = validateId(input.courseId, "courseId");
  if (!course.ok) issues.push(...course.issues.map((i) => ({ path: i.path, message: i.message })));

  if (!input.title?.trim()) {
    issues.push({ path: "title", message: "title is required" });
  }

  if (!input.lessons?.length) {
    issues.push({ path: "lessons", message: "at least one lesson is required" });
  }

  if (!input.layout) {
    issues.push({ path: "layout", message: "layout is required" });
  } else if (!VALID_LAYOUTS.includes(input.layout)) {
    issues.push({
      path: "layout",
      message: `layout must be one of: ${VALID_LAYOUTS.join(", ")}`,
    });
  }

  const layout = input.layout;
  const themePreset = input.theme?.preset;
  if (themePreset !== undefined && !VALID_THEME_PRESETS.includes(themePreset)) {
    issues.push({
      path: "theme.preset",
      message: `unknown preset; use one of: ${VALID_THEME_PRESETS.join(", ")}`,
    });
  }

  if (input.theme?.theme) {
    try {
      themeToLxpackRuntime({ preset: themePreset, theme: input.theme.theme as LessonkitThemeV1 });
    } catch (err) {
      issues.push({
        path: "theme.theme",
        message: err instanceof Error ? err.message : "invalid custom theme",
      });
    }
  }

  const completionThreshold = input.tracking?.completion?.threshold;
  if (completionThreshold !== undefined) {
    if (
      !Number.isFinite(completionThreshold) ||
      completionThreshold < 0 ||
      completionThreshold > 1
    ) {
      issues.push({
        path: "tracking.completion.threshold",
        message: "threshold must be a finite number between 0 and 1",
      });
    }
  }

  if (layout === "single-spa" && (input.lessons?.length ?? 0) > 1) {
    issues.push({
      path: "lessons",
      message:
        "single-spa layout packages one SPA lesson; remove extra lesson entries or use per-lesson-spa",
    });
  }

  const lessonIds = new Set<string>();
  const spaPaths = new Set<string>();
  for (const [index, lesson] of (input.lessons ?? []).entries()) {
    const path = `lessons[${index}]`;
    const lessonResult = validateId(lesson.id, `${path}.id`);
    if (!lessonResult.ok) {
      issues.push(...lessonResult.issues.map((i) => ({ path: i.path, message: i.message })));
    } else if (lessonIds.has(lessonResult.id)) {
      issues.push({ path: `${path}.id`, message: "duplicate lesson id" });
    } else {
      lessonIds.add(lessonResult.id);
    }
    if (!lesson.title?.trim()) {
      issues.push({ path: `${path}.title`, message: "lesson title is required" });
    }
    if (layout === "per-lesson-spa") {
      const spaPath = lesson.spaPath?.trim();
      if (!spaPath) {
        issues.push({
          path: `${path}.spaPath`,
          message: "spaPath is required for per-lesson-spa layout",
        });
      } else if (!isSafeRelativeSpaPath(spaPath)) {
        issues.push({
          path: `${path}.spaPath`,
          message:
            "spaPath must be a relative path without '..' segments or absolute prefixes",
        });
      } else if (spaPaths.has(spaPath)) {
        issues.push({ path: `${path}.spaPath`, message: "duplicate spaPath" });
      } else {
        spaPaths.add(spaPath);
      }
    }
  }

  if (layout === "single-spa" && input.spaLessonId?.trim()) {
    const spaId = input.spaLessonId.trim();
    const spaResult = validateId(spaId, "spaLessonId");
    if (!spaResult.ok) {
      issues.push(...spaResult.issues.map((i) => ({ path: i.path, message: i.message })));
    } else if (!lessonIds.has(spaResult.id)) {
      issues.push({
        path: "spaLessonId",
        message: "spaLessonId must match a lesson id in lessons",
      });
    }
  }

  const checkIds = new Set<string>();
  for (const [index, assessment] of (input.assessments ?? []).entries()) {
    validateAssessmentEntry(assessment, index, issues, checkIds);
  }

  return issues;
}
