import * as fsp from "node:fs/promises";

async function pathExists(path: string): Promise<boolean> {
  try {
    await fsp.access(path);
    return true;
  } catch {
    return false;
  }
}

async function renameOrCopy(from: string, to: string): Promise<void> {
  try {
    await fsp.rename(from, to);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
    if (code !== "EXDEV") throw err;
    await fsp.cp(from, to, { recursive: true });
    await fsp.rm(from, { recursive: true, force: true });
  }
}

/**
 * Atomically replace `outDir` with the packaged tree at `stagingDir`.
 * Restores the previous `outDir` when promote fails after a backup rename.
 */
export async function promoteStagingToOutDir(stagingDir: string, outDir: string): Promise<void> {
  const tmpPromote = `${outDir}.tmp-promote`;
  const backup = `${outDir}.bak`;

  await renameOrCopy(stagingDir, tmpPromote);

  const hadOutDir = await pathExists(outDir);
  if (hadOutDir) {
    await renameOrCopy(outDir, backup);
  }

  try {
    await renameOrCopy(tmpPromote, outDir);
  } catch (promoteError) {
    if (hadOutDir) {
      try {
        await renameOrCopy(backup, outDir);
      } catch (restoreError) {
        const failedPromote = `${outDir}.failed-promote-${Date.now()}`;
        try {
          await renameOrCopy(tmpPromote, failedPromote);
        } catch {
          await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(() => undefined);
        }
        const promoteMsg =
          promoteError instanceof Error ? promoteError.message : String(promoteError);
        const restoreMsg =
          restoreError instanceof Error ? restoreError.message : String(restoreError);
        throw new Error(
          `[lessonkit/lxpack] promote failed (${promoteMsg}) and could not restore ${outDir} (${restoreMsg}). ` +
            `Recovery: previous output may be in ${backup}; staged package may be in ${failedPromote}.`,
        );
      }
    } else {
      try {
        await renameOrCopy(tmpPromote, stagingDir);
      } catch (restoreError) {
        console.warn(
          `[lessonkit/lxpack] failed to restore ${stagingDir} after promote error:`,
          restoreError instanceof Error ? restoreError.message : restoreError,
        );
        await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(() => undefined);
      }
      throw promoteError;
    }
    const failedPromote = `${outDir}.failed-promote-${Date.now()}`;
    try {
      await renameOrCopy(tmpPromote, failedPromote);
    } catch {
      await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(() => undefined);
    }
    throw promoteError;
  }

  if (hadOutDir) {
    await fsp.rm(backup, { recursive: true, force: true }).catch(() => undefined);
  }
}
