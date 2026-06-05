import {
  normalizeStudioProject,
  validateStudioProject,
  type StudioProjectV1,
} from "@lessonkit/studio-schema";
import type { StudioValidationIssue } from "@lessonkit/studio-schema";
import type { ExportValidationResult, StudioExportOptions } from "./types";
import { collectAssessments } from "./collectQuizzes";

export function assertExportableProject(
  project: StudioProjectV1,
  _options: StudioExportOptions = {},
): ExportValidationResult {
  const validation = validateStudioProject(project);
  if (!validation.ok) {
    return { ok: false, issues: validation.issues };
  }

  if (!project.pages.length) {
    return {
      ok: false,
      issues: [{ path: "pages", message: "at least one page is required for export" }],
    };
  }

  try {
    collectAssessments(project);
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          path: "pages",
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  const warnings: StudioValidationIssue[] = [];
  if (project.pages.length > 1) {
    warnings.push({
      path: "pages",
      message:
        "LXPack single-spa export maps only the first page to lessonkit.json; additional pages stay in project.json and exported React lessons",
    });
  }

  return {
    ok: true,
    project: normalizeStudioProject(project),
    ...(warnings.length ? { warnings } : {}),
  };
}
