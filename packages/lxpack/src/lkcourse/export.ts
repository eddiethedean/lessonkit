import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { parseLessonkitInterchange } from "@lxpack/validators";
import { descriptorToInterchange } from "../interchange";
import { assertRealPathUnderRoot } from "../spaPath";
import { assertSpaDistContentsSafe } from "../spaDistValidation";
import { extractBlockTree, validateBlockTreeIds } from "./blockTree";
import { parseLkcourseEnvelope } from "./parseEnvelope";
import {
  collectDistEntries,
  createZip,
  isSafeZipEntryPath,
  utf8ToEntry,
} from "./zip";
import type { ExportLkcourseOptions, ExportLkcourseResult } from "./types";

function resolveLessonkitVersion(explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("../../package.json") as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/**
 * Build a portable `.lkcourse` zip (manifest envelope + interchange + dist).
 * Prefer `lessonkit export` in course projects.
 *
 * @example
 * ```ts
 * import { exportLkcourse } from "@lessonkit/lxpack";
 *
 * const result = await exportLkcourse({
 *   projectRoot: "/path/to/course",
 *   manifest: parsedLessonkitJson,
 *   archivePath: "handoff.lkcourse",
 * });
 * ```
 */
export async function exportLkcourse(options: ExportLkcourseOptions): Promise<ExportLkcourseResult> {
  const projectRoot = resolve(options.projectRoot);
  const manifest = options.manifest;
  const spaDistDir = join(projectRoot, manifest.paths.spaDistDir);

  try {
    assertRealPathUnderRoot(projectRoot, spaDistDir);
    await assertSpaDistContentsSafe({ main: spaDistDir }, projectRoot);
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          path: manifest.paths.spaDistDir,
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  const interchange = descriptorToInterchange(manifest.course);
  const interchangeParsed = parseLessonkitInterchange(interchange);
  if (!interchangeParsed.ok) {
    return {
      ok: false,
      issues: interchangeParsed.issues.map((i) => ({
        path: `interchange.${i.path ?? ""}`.replace(/\.$/, ""),
        message: i.message,
      })),
    };
  }

  const validatedInterchange = interchangeParsed.data;
  const interchangeCourseId = validatedInterchange.course?.id;
  if (!interchangeCourseId) {
    return {
      ok: false,
      issues: [{ path: "interchange.course.id", message: "missing course id in interchange" }],
    };
  }

  if (manifest.course.courseId !== interchangeCourseId) {
    return {
      ok: false,
      issues: [
        {
          path: "course.courseId",
          message: `descriptor courseId "${manifest.course.courseId}" does not match interchange course.id "${interchangeCourseId}"`,
        },
      ],
    };
  }

  const zipEntries = new Map<string, Buffer | Uint8Array>();

  const interchangeJson = JSON.stringify(interchange, null, 2);
  zipEntries.set("interchange.json", utf8ToEntry(interchangeJson));

  let blockTreeJson: string | undefined;
  if (options.includeBlockTree) {
    const blockTree = extractBlockTree({ projectRoot });
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
    blockTreeJson = JSON.stringify(blockTree, null, 2);
    zipEntries.set("block-tree.json", utf8ToEntry(blockTreeJson));
  }

  let distEntries: Map<string, Buffer>;
  try {
    distEntries = await collectDistEntries(spaDistDir, manifest.paths.spaDistDir);
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          path: manifest.paths.spaDistDir,
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  if (!distEntries.has(`${manifest.paths.spaDistDir}/index.html`.replace(/\\/g, "/"))) {
    return {
      ok: false,
      issues: [
        {
          path: `${manifest.paths.spaDistDir}/index.html`,
          message: "dist must contain index.html before export",
        },
      ],
    };
  }

  for (const [path, data] of distEntries) {
    zipEntries.set(path, data);
  }

  const entryPaths = [...zipEntries.keys()].sort();
  const envelope = {
    format: "lkcourse" as const,
    schemaVersion: 1 as const,
    lessonkitVersion: resolveLessonkitVersion(options.lessonkitVersion),
    exportedAt: new Date().toISOString(),
    sourceManifest: manifest,
    entries: entryPaths,
  };

  const envelopeCheck = parseLkcourseEnvelope(envelope);
  if (!envelopeCheck.ok) {
    return { ok: false, issues: envelopeCheck.issues };
  }

  zipEntries.set("manifest.json", utf8ToEntry(JSON.stringify(envelope, null, 2)));

  const archivePath = resolve(
    projectRoot,
    options.outPath ?? `${manifest.name}.lkcourse`,
  );
  try {
    assertRealPathUnderRoot(projectRoot, archivePath);
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          path: options.outPath ?? `${manifest.name}.lkcourse`,
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  if (!isSafeZipEntryPath(options.outPath ?? `${manifest.name}.lkcourse`)) {
    return {
      ok: false,
      issues: [{ path: "outPath", message: "output path must be a safe relative path" }],
    };
  }

  try {
    await mkdir(dirname(archivePath), { recursive: true });
    const zipped = createZip(zipEntries);
    await writeFile(archivePath, zipped);
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          path: archivePath,
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  return {
    ok: true,
    archivePath,
    fileCount: zipEntries.size,
    includeBlockTree: Boolean(options.includeBlockTree),
  };
}
