import type { MigrateStudioProjectResult } from "./types";
import { isRecord } from "./parseUtils";

export function migrateStudioProject(raw: unknown): MigrateStudioProjectResult {
  if (!isRecord(raw)) {
    return { doc: raw, migrationsApplied: [] };
  }

  let doc: Record<string, unknown> = { ...raw };
  const migrationsApplied: string[] = [];

  if (doc.schemaVersion === "1") {
    doc = { ...doc, schemaVersion: 1 };
    migrationsApplied.push("coerce-schemaVersion-string-to-number");
  }

  if (doc.schemaVersion === undefined) {
    doc = { ...doc, schemaVersion: 1 };
    migrationsApplied.push("default-schemaVersion-1");
  }

  return { doc, migrationsApplied };
}
