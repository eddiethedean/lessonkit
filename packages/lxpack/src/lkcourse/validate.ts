import { parseLessonkitInterchange } from "@lxpack/validators";
import { validateBlockTreeIds } from "./blockTree";
import { parseLkcourseEnvelope } from "./parseEnvelope";
import { entryToUtf8, readZip } from "./zip";
import type { BlockTreeV1, LkcourseValidationIssue, ValidateLkcourseResult } from "./types";

export function validateLkcourseArchiveEntries(
  entries: Map<string, Uint8Array>,
  _archiveLabel: string,
): ValidateLkcourseResult {
  const issues: LkcourseValidationIssue[] = [];

  const manifestData = entries.get("manifest.json");
  if (!manifestData) {
    return {
      ok: false,
      issues: [{ path: "manifest.json", message: "required file missing from archive" }],
    };
  }

  let envelopeRaw: unknown;
  try {
    envelopeRaw = JSON.parse(entryToUtf8(manifestData));
  } catch {
    return {
      ok: false,
      issues: [{ path: "manifest.json", message: "invalid JSON" }],
    };
  }

  const envelopeParsed = parseLkcourseEnvelope(envelopeRaw, "manifest.json");
  if (!envelopeParsed.ok) {
    return { ok: false, issues: envelopeParsed.issues };
  }

  const envelope = envelopeParsed.envelope;

  const interchangeData = entries.get("interchange.json");
  if (!interchangeData) {
    issues.push({ path: "interchange.json", message: "required file missing from archive" });
  }

  const spaDistDir = envelope.sourceManifest.paths.spaDistDir.replace(/\\/g, "/");
  const spaIndexPath = `${spaDistDir}/index.html`;
  if (!entries.has(spaIndexPath)) {
    issues.push({ path: spaIndexPath, message: "required file missing from archive" });
  }

  const allowlisted = new Set(envelope.entries.map((entryPath) => entryPath.replace(/\\/g, "/")));
  const spaDistPrefix = `${spaDistDir}/`;

  for (const entryPath of envelope.entries) {
    if (!entries.has(entryPath)) {
      issues.push({
        path: entryPath,
        message: "listed in manifest.entries but missing from archive",
      });
    }
  }

  for (const zipPath of entries.keys()) {
    const normalized = zipPath.replace(/\\/g, "/");
    if (!normalized.startsWith(spaDistPrefix)) continue;
    if (!allowlisted.has(normalized)) {
      issues.push({
        path: zipPath,
        message: "unlisted file under spaDistDir; not in manifest.entries",
      });
    }
  }

  if (issues.length) return { ok: false, issues };

  let interchangeRaw: unknown;
  try {
    interchangeRaw = JSON.parse(entryToUtf8(interchangeData!));
  } catch {
    return {
      ok: false,
      issues: [{ path: "interchange.json", message: "invalid JSON" }],
    };
  }

  const interchangeParsed = parseLessonkitInterchange(interchangeRaw);
  if (!interchangeParsed.ok) {
    return {
      ok: false,
      issues: interchangeParsed.issues.map((i) => ({
        path: `interchange.${i.path ?? ""}`.replace(/\.$/, ""),
        message: i.message,
      })),
    };
  }

  const interchange = interchangeParsed.data;
  const interchangeCourseId = interchange.course?.id;

  if (!interchangeCourseId) {
    issues.push({
      path: "interchange.course.id",
      message: "missing course id in interchange",
    });
  } else if (envelope.sourceManifest.course.courseId !== interchangeCourseId) {
    issues.push({
      path: "sourceManifest.course.courseId",
      message: `does not match interchange.course.id (${interchangeCourseId})`,
    });
  }

  if (issues.length) return { ok: false, issues };

  const blockTreeData = entries.get("block-tree.json");
  if (blockTreeData) {
    let blockTreeRaw: unknown;
    try {
      blockTreeRaw = JSON.parse(entryToUtf8(blockTreeData));
    } catch {
      return {
        ok: false,
        issues: [{ path: "block-tree.json", message: "invalid JSON" }],
      };
    }
    const blockTree = blockTreeRaw as BlockTreeV1;
    if (Array.isArray(blockTree?.blocks)) {
      const blockTreeIssues = validateBlockTreeIds(blockTree);
      if (blockTreeIssues.length) {
        return {
          ok: false,
          issues: blockTreeIssues.map((issue) => ({
            path: `block-tree.${issue.path}`,
            message: issue.message,
          })),
        };
      }
    }
  }

  return {
    ok: true,
    envelope,
    interchange,
  };
}

export function validateLkcourse(archivePath: string): ValidateLkcourseResult {
  const read = readZip(archivePath);
  if (!read.ok) return read;

  return validateLkcourseArchiveEntries(read.entries, archivePath);
}
