import { access, cp, mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { assertRealPathUnderRoot } from "../spaPath";
import type { LessonkitManifest } from "../manifest";
import { validateLkcourse } from "./validate";
import { isSafeZipEntryPath, readZip } from "./zip";
import type { ImportLkcourseOptions, ImportLkcourseResult } from "./types";

const IMPORT_ARTIFACTS = ["lessonkit.json", "dist"] as const;

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function renameOrCopy(
  from: string,
  to: string,
  opts?: { renameFn?: typeof rename },
): Promise<void> {
  const renameFn = opts?.renameFn ?? rename;
  try {
    await renameFn(from, to);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
    if (code !== "EXDEV") throw err;
    await cp(from, to, { recursive: true });
    await rm(from, { recursive: true, force: true });
  }
}

async function writeImportTree(
  stagingDir: string,
  manifest: LessonkitManifest,
  entries: Map<string, Uint8Array>,
  spaDistDir: string,
): Promise<number> {
  let fileCount = 0;

  await writeFile(
    join(stagingDir, "lessonkit.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  fileCount += 1;

  for (const [entryPath, data] of entries) {
    const normalized = entryPath.replace(/\\/g, "/");
    if (!normalized.startsWith(`${spaDistDir}/`)) continue;

    const relativeUnderSpa = normalized.slice(spaDistDir.length + 1);

    const outPath = join(stagingDir, spaDistDir, relativeUnderSpa);
    const resolvedOut = resolve(outPath);
    assertRealPathUnderRoot(stagingDir, resolvedOut);

    if (!isSafeZipEntryPath(join(spaDistDir, relativeUnderSpa))) {
      throw new Error(`unsafe extraction path: ${entryPath}`);
    }

    await mkdir(dirname(resolvedOut), { recursive: true });
    await writeFile(resolvedOut, data);
    fileCount += 1;
  }

  return fileCount;
}

/** @internal Exported for unit tests. */
export { renameOrCopy };

/** @internal Exported for unit tests. */
export async function backupImportArtifacts(targetDir: string): Promise<string | undefined> {
  const existing: string[] = [];
  for (const name of IMPORT_ARTIFACTS) {
    if (await pathExists(join(targetDir, name))) {
      existing.push(name);
    }
  }
  if (!existing.length) return undefined;

  const backupDir = await mkdtemp(join(targetDir, ".lkcourse-backup-"));
  for (const name of existing) {
    await renameOrCopy(join(targetDir, name), join(backupDir, name));
  }
  return backupDir;
}

/** @internal Exported for unit tests. */
export async function restoreImportBackup(targetDir: string, backupDir: string): Promise<void> {
  for (const name of IMPORT_ARTIFACTS) {
    const backupPath = join(backupDir, name);
    if (!(await pathExists(backupPath))) continue;
    const destPath = join(targetDir, name);
    if (await pathExists(destPath)) {
      await rm(destPath, { recursive: true, force: true });
    }
    await renameOrCopy(backupPath, destPath);
  }
}

async function promoteImportStaging(stagingDir: string, targetDir: string): Promise<void> {
  const entries = await readdir(stagingDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(stagingDir, entry.name);
    const destPath = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await cp(srcPath, destPath, { recursive: true, force: true });
    } else if (entry.isFile()) {
      await mkdir(dirname(destPath), { recursive: true });
      await cp(srcPath, destPath);
    }
  }
}

type PromoteImportStagingFn = typeof promoteImportStaging;
let promoteImportStagingImpl: PromoteImportStagingFn = promoteImportStaging;

/** @internal Reset or override promote for unit tests. */
export function __setPromoteImportStagingForTests(fn: PromoteImportStagingFn | null): void {
  promoteImportStagingImpl = fn ?? promoteImportStaging;
}

/**
 * Extract a `.lkcourse` archive into a project directory (manifest + dist tree).
 *
 * @example
 * ```ts
 * import { importLkcourse } from "@lessonkit/lxpack";
 *
 * const result = await importLkcourse({
 *   archivePath: "handoff.lkcourse",
 *   targetDir: "/path/to/dest",
 * });
 * ```
 */
export async function importLkcourse(
  options: ImportLkcourseOptions,
): Promise<ImportLkcourseResult> {
  const archivePath = resolve(options.archivePath);
  const targetDir = resolve(options.targetDir);

  const validated = validateLkcourse(archivePath);
  if (!validated.ok) return validated;

  const { envelope, interchange } = validated;
  const manifest = envelope.sourceManifest;
  const spaDistDir = manifest.paths.spaDistDir.replace(/\\/g, "/");

  try {
    await mkdir(targetDir, { recursive: true });
    assertRealPathUnderRoot(targetDir, targetDir);
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          path: targetDir,
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  const read = readZip(archivePath);
  if (!read.ok) return read;

  let stagingDir: string | undefined;
  let backupDir: string | undefined;
  try {
    stagingDir = await mkdtemp(join(targetDir, ".lkcourse-import-"));
    const fileCount = await writeImportTree(stagingDir, manifest, read.entries, spaDistDir);
    backupDir = await backupImportArtifacts(targetDir);
    try {
      await promoteImportStagingImpl(stagingDir, targetDir);
    } catch (promoteError) {
      if (backupDir) {
        await restoreImportBackup(targetDir, backupDir);
      }
      throw promoteError;
    }
    if (backupDir) {
      await rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
      backupDir = undefined;
    }
    await rm(stagingDir, { recursive: true, force: true });
    stagingDir = undefined;

    return {
      ok: true,
      targetDir,
      manifest,
      interchange,
      fileCount,
    };
  } catch (err) {
    if (backupDir) {
      await restoreImportBackup(targetDir, backupDir).catch(() => undefined);
      await rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
    }
    if (stagingDir) {
      await rm(stagingDir, { recursive: true, force: true }).catch(() => undefined);
    }
    return {
      ok: false,
      issues: [
        {
          path: targetDir,
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }
}
