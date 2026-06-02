import {
  normalizeStudioProject,
  validateStudioProject,
  type StudioProjectV1,
} from "@lessonkit/studio-schema";
import type { ExportValidationResult, StudioExportOptions } from "./types";
import { collectQuizAssessments } from "./collectQuizzes";

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
    collectQuizAssessments(project);
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

  return { ok: true, project: normalizeStudioProject(project) };
}
