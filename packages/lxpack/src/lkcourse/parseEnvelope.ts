import { parseLessonkitManifest } from "../manifest";
import { isSafeZipEntryPath } from "./zip";
import type { LkcourseEnvelopeV1, LkcourseValidationIssue } from "./types";

export type ParseEnvelopeResult =
  | { ok: true; envelope: LkcourseEnvelopeV1 }
  | { ok: false; issues: LkcourseValidationIssue[] };

export function parseLkcourseEnvelope(raw: unknown, label = "manifest.json"): ParseEnvelopeResult {
  const issues: LkcourseValidationIssue[] = [];

  if (!raw || typeof raw !== "object") {
    return { ok: false, issues: [{ path: label, message: "must be a JSON object" }] };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.format !== "lkcourse") {
    issues.push({
      path: "format",
      message: `must be "lkcourse" (got ${String(obj.format)})`,
    });
  }

  let schemaVersion = obj.schemaVersion;
  if (schemaVersion === "1") schemaVersion = 1;
  if (schemaVersion !== 1) {
    issues.push({
      path: "schemaVersion",
      message: `must be 1 (got ${String(obj.schemaVersion)})`,
    });
  }

  const lessonkitVersion =
    typeof obj.lessonkitVersion === "string" ? obj.lessonkitVersion.trim() : "";
  if (!lessonkitVersion) {
    issues.push({ path: "lessonkitVersion", message: "must be a non-empty string" });
  }

  const exportedAt = typeof obj.exportedAt === "string" ? obj.exportedAt.trim() : "";
  if (!exportedAt) {
    issues.push({ path: "exportedAt", message: "must be a non-empty string" });
  }

  const entriesRaw = obj.entries;
  const entries: string[] = [];
  if (!Array.isArray(entriesRaw) || entriesRaw.length === 0) {
    issues.push({ path: "entries", message: "must be a non-empty array of relative paths" });
  } else {
    for (let i = 0; i < entriesRaw.length; i++) {
      const entry = entriesRaw[i];
      if (typeof entry !== "string" || !entry.trim()) {
        issues.push({ path: `entries[${i}]`, message: "must be a non-empty string" });
      } else {
        const trimmed = entry.trim();
        if (!isSafeZipEntryPath(trimmed)) {
          issues.push({ path: `entries[${i}]`, message: "must be a safe relative path" });
        } else {
          entries.push(trimmed);
        }
      }
    }
  }

  if (issues.length) return { ok: false, issues };

  const manifestParsed = parseLessonkitManifest(obj.sourceManifest, `${label}.sourceManifest`);
  if (!manifestParsed.ok) {
    return {
      ok: false,
      issues: manifestParsed.issues.map((issue) => ({
        path: `sourceManifest.${issue.path}`,
        message: issue.message,
      })),
    };
  }

  return {
    ok: true,
    envelope: {
      format: "lkcourse",
      schemaVersion: 1,
      lessonkitVersion,
      exportedAt,
      sourceManifest: manifestParsed.manifest,
      entries,
    },
  };
}
