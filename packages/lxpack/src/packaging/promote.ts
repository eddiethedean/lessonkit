import * as fsp from "node:fs/promises";

async function pathExists(path: string): Promise<boolean> {
  try {
    await fsp.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Atomically replace `outDir` with the packaged tree at `stagingDir`.
 * Restores the previous `outDir` when promote fails after a backup rename.
 */
export async function promoteStagingToOutDir(stagingDir: string, outDir: string): Promise<void> {
  const tmpPromote = `${outDir}.tmp-promote`;
  const backup = `${outDir}.bak`;

  await fsp.rename(stagingDir, tmpPromote);

  const hadOutDir = await pathExists(outDir);
  if (hadOutDir) {
    await fsp.rename(outDir, backup);
  }

  try {
    await fsp.rename(tmpPromote, outDir);
  } catch (promoteError) {
    if (hadOutDir) {
      try {
        await fsp.rename(backup, outDir);
      } catch (restoreError) {
        console.warn(
          `[lessonkit/lxpack] failed to restore ${outDir} after promote error:`,
          restoreError instanceof Error ? restoreError.message : restoreError,
        );
      }
    } else {
      try {
        await fsp.rename(tmpPromote, stagingDir);
      } catch (restoreError) {
        console.warn(
          `[lessonkit/lxpack] failed to restore ${stagingDir} after promote error:`,
          restoreError instanceof Error ? restoreError.message : restoreError,
        );
        await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(() => undefined);
      }
      throw promoteError;
    }
    await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(() => undefined);
    throw promoteError;
  }

  if (hadOutDir) {
    await fsp.rm(backup, { recursive: true, force: true }).catch(() => undefined);
  }
}
