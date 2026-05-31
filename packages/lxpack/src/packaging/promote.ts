import * as fsp from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

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

async function assertNoLegacyPromoteArtifacts(outDir: string): Promise<void> {
  const legacyTmp = `${outDir}.tmp-promote`;
  const legacyBak = `${outDir}.bak`;
  const stale: string[] = [];
  if (await pathExists(legacyTmp)) stale.push(legacyTmp);
  if (await pathExists(legacyBak)) stale.push(legacyBak);
  if (stale.length) {
    throw new Error(
      `[lessonkit/lxpack] cannot promote: remove stale packaging artifacts from a previous failed run: ${stale.join(", ")}`,
    );
  }
}

/**
 * Atomically replace `outDir` with the packaged tree at `stagingDir`.
 * Restores the previous `outDir` when promote fails after a backup rename.
 */
export async function promoteStagingToOutDir(stagingDir: string, outDir: string): Promise<void> {
  await assertNoLegacyPromoteArtifacts(outDir);

  const parent = dirname(outDir);
  const tmpPromote = await fsp.mkdtemp(join(parent, ".lk-promote-"));

  await renameOrCopy(stagingDir, tmpPromote);

  const hadOutDir = await pathExists(outDir);
  const backup = hadOutDir ? await fsp.mkdtemp(join(parent, ".lk-backup-")) : undefined;
  if (hadOutDir && backup) {
    await renameOrCopy(outDir, backup);
  }

  try {
    await renameOrCopy(tmpPromote, outDir);
  } catch (promoteError) {
    if (hadOutDir && backup) {
      try {
        await renameOrCopy(backup, outDir);
      } catch (restoreError) {
        const failedPromote = join(parent, `.lk-failed-promote-${randomUUID()}`);
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
    const failedPromote = join(parent, `.lk-failed-promote-${randomUUID()}`);
    try {
      await renameOrCopy(tmpPromote, failedPromote);
    } catch {
      await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(() => undefined);
    }
    throw promoteError;
  }

  if (backup) {
    await fsp.rm(backup, { recursive: true, force: true }).catch(() => undefined);
  }
}
