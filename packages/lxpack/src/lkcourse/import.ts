import { cp, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { assertRealPathUnderRoot } from "../spaPath";
import type { LessonkitManifest } from "../manifest";
import { validateLkcourse } from "./validate";
import { isSafeZipEntryPath, readZip } from "./zip";
import type { ImportLkcourseOptions, ImportLkcourseResult } from "./types";

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
  try {
    stagingDir = await mkdtemp(join(targetDir, ".lkcourse-import-"));
    const fileCount = await writeImportTree(stagingDir, manifest, read.entries, spaDistDir);
    await promoteImportStaging(stagingDir, targetDir);
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
