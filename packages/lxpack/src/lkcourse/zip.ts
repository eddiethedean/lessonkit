import { readFileSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { isSafeRelativeSpaPath } from "../spaPath";
import type { LkcourseValidationIssue } from "./types";

export const MAX_LKCOURSE_UNCOMPRESSED_BYTES = 256 * 1024 * 1024;

export function isSafeZipEntryPath(entryPath: string): boolean {
  const normalized = normalize(entryPath).replace(/\\/g, "/");
  if (!normalized.length || normalized.startsWith("/") || normalized.includes("\0")) {
    return false;
  }
  const segments = normalized.split("/").filter((s) => s.length > 0);
  if (segments.some((s) => s === "..")) return false;
  return segments.length > 0;
}

export function createZip(entries: Map<string, Buffer | Uint8Array>): Uint8Array {
  const zipped: Record<string, Uint8Array> = {};
  for (const [path, data] of entries) {
    if (!isSafeZipEntryPath(path)) {
      throw new Error(`unsafe zip entry path: ${path}`);
    }
    zipped[path.replace(/\\/g, "/")] = data instanceof Uint8Array ? data : new Uint8Array(data);
  }
  return zipSync(zipped, { level: 6 });
}

export type ReadZipResult =
  | { ok: true; entries: Map<string, Uint8Array> }
  | { ok: false; issues: LkcourseValidationIssue[] };

export function readZip(archivePath: string): ReadZipResult {
  const issues: LkcourseValidationIssue[] = [];

  let raw: Uint8Array;
  try {
    raw = readFileSync(archivePath);
  } catch {
    return { ok: false, issues: [{ path: archivePath, message: "failed to read archive" }] };
  }

  if (!raw.length) {
    return { ok: false, issues: [{ path: archivePath, message: "archive is empty" }] };
  }

  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(raw);
  } catch {
    return { ok: false, issues: [{ path: archivePath, message: "invalid zip archive" }] };
  }

  const entries = new Map<string, Uint8Array>();
  let totalUncompressed = 0;

  for (const [path, data] of Object.entries(unzipped)) {
    const normalized = path.replace(/\\/g, "/");
    if (!isSafeZipEntryPath(normalized)) {
      issues.push({ path: normalized, message: "unsafe zip entry path" });
      continue;
    }
    totalUncompressed += data.byteLength;
    if (totalUncompressed > MAX_LKCOURSE_UNCOMPRESSED_BYTES) {
      return {
        ok: false,
        issues: [
          {
            path: archivePath,
            message: `archive exceeds max uncompressed size (${MAX_LKCOURSE_UNCOMPRESSED_BYTES} bytes)`,
          },
        ],
      };
    }
    entries.set(normalized, data);
  }

  if (issues.length) return { ok: false, issues };
  return { ok: true, entries };
}

export async function collectDistEntries(
  distDir: string,
  spaDistRelative: string,
): Promise<Map<string, Buffer>> {
  const { lstat, readdir, readFile } = await import("node:fs/promises");
  const entries = new Map<string, Buffer>();

  const walk = async (absDir: string, relPrefix: string) => {
    const dirEntries = await readdir(absDir, { withFileTypes: true });
    for (const entry of dirEntries) {
      const abs = join(absDir, entry.name);
      const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      const zipPath = `${spaDistRelative}/${rel}`.replace(/\\/g, "/");
      if (!isSafeRelativeSpaPath(zipPath) && !zipPath.startsWith(`${spaDistRelative}/`)) {
        throw new Error(`unsafe dist path: ${zipPath}`);
      }
      const stat = await lstat(abs);
      if (stat.isSymbolicLink()) {
        throw new Error(`dist contains symlink: ${abs}`);
      }
      if (stat.isDirectory()) {
        await walk(abs, rel);
      } else if (stat.isFile()) {
        entries.set(zipPath.replace(/\\/g, "/"), await readFile(abs));
      }
    }
  };

  await walk(distDir, "");
  return entries;
}

export function entryToUtf8(data: Uint8Array): string {
  return strFromU8(data);
}

export function utf8ToEntry(text: string): Uint8Array {
  return strToU8(text);
}

export function ensureParentDir(filePath: string): string {
  return dirname(filePath);
}

export function statArchiveSize(archivePath: string): number {
  return statSync(archivePath).size;
}
