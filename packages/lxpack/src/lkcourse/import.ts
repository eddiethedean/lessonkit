import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { assertRealPathUnderRoot } from "../spaPath";
import { validateLkcourse } from "./validate";
import { isSafeZipEntryPath, readZip } from "./zip";
import type { ImportLkcourseOptions, ImportLkcourseResult } from "./types";

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

  let fileCount = 0;

  try {
    await writeFile(
      join(targetDir, "lessonkit.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
    fileCount += 1;

    for (const [entryPath, data] of read.entries) {
      const normalized = entryPath.replace(/\\/g, "/");
      if (!normalized.startsWith(`${spaDistDir}/`)) continue;

      const relativeUnderSpa = normalized.slice(spaDistDir.length + 1);

      const outPath = join(targetDir, spaDistDir, relativeUnderSpa);
      const resolvedOut = resolve(outPath);
      assertRealPathUnderRoot(targetDir, resolvedOut);

      if (!isSafeZipEntryPath(join(spaDistDir, relativeUnderSpa))) {
        return {
          ok: false,
          issues: [{ path: entryPath, message: "unsafe extraction path" }],
        };
      }

      await mkdir(dirname(resolvedOut), { recursive: true });
      await writeFile(resolvedOut, data);
      fileCount += 1;
    }
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

  return {
    ok: true,
    targetDir,
    manifest,
    interchange,
    fileCount,
  };
}
