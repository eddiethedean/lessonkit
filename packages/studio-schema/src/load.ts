import { migrateStudioProject } from "./migrate";
import { normalizeStudioProject } from "./normalize";
import { parseStudioProject } from "./parse";
import type { ParseStudioProjectResult, StudioProjectV1 } from "./types";
import { validateStudioProject } from "./validate";

export type LoadStudioProjectResult =
  | { ok: true; project: StudioProjectV1; migrationsApplied: string[] }
  | { ok: false; issues: { path: string; message: string }[] };

export function loadStudioProject(raw: unknown, label = "project"): LoadStudioProjectResult {
  const { doc, migrationsApplied } = migrateStudioProject(raw);
  const parsed: ParseStudioProjectResult = parseStudioProject(doc, label);
  if (!parsed.ok) return { ok: false, issues: parsed.issues };

  const validation = validateStudioProject(parsed.project);
  if (!validation.ok) return { ok: false, issues: validation.issues };

  const project = normalizeStudioProject(parsed.project);
  return { ok: true, project, migrationsApplied };
}
