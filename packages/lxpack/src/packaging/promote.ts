import * as fsp from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";

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

function promoteLockPath(outDir: string): string {
  const parent = dirname(outDir);
  const hash = createHash("sha256").update(resolve(outDir)).digest("hex").slice(0, 16);
  return join(parent, `.lk-promote-lock-${hash}`);
}

async function withPromoteLock<T>(outDir: string, fn: () => Promise<T>): Promise<T> {
  const lockPath = promoteLockPath(outDir);
  await fsp.mkdir(dirname(outDir), { recursive: true });

  let lockHandle: fsp.FileHandle | undefined;
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      lockHandle = await fsp.open(lockPath, "wx");
      await lockHandle.writeFile(`${process.pid}\n`, "utf8");
      break;
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
      if (code !== "EEXIST") throw err;
      await new Promise((resolveWait) => setTimeout(resolveWait, 25));
    }
  }
  if (!lockHandle) {
    throw new Error(`[lessonkit/lxpack] timed out acquiring promote lock for ${outDir}`);
  }

  try {
    return await fn();
  } finally {
    await lockHandle.close().catch(/* v8 ignore next */ () => undefined);
    await fsp.rm(lockPath, { force: true }).catch(/* v8 ignore next */ () => undefined);
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
/** @internal For coverage of filesystem helpers. */
export const __testPromoteFs = { pathExists, renameOrCopy };
export { pathExists, renameOrCopy };

export async function promoteStagingToOutDir(stagingDir: string, outDir: string): Promise<void> {
  return withPromoteLock(outDir, async () => {
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
            await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
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
          await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
        }
        throw promoteError;
      }
      const failedPromote = join(parent, `.lk-failed-promote-${randomUUID()}`);
      try {
        await renameOrCopy(tmpPromote, failedPromote);
      } catch {
        /* v8 ignore next 2 */
        await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
      }
      throw promoteError;
    }

    if (backup) {
      await fsp.rm(backup, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
    }
  });
}
