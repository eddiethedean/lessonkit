import * as fsp from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { assertRealPathUnderRoot } from "../spaPath";

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

const STALE_ARTIFACT_TTL_MS = 5 * 60 * 1000;
const MAX_LOCK_AGE_MS = 30 * 60 * 1000;

const LOCK_TOKEN_RE = /^(\d+)\n([0-9a-f-]{36})(?:\n(\d+))?\n?$/i;

async function isStalePromoteLock(lockPath: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(lockPath);
    const content = await fsp.readFile(lockPath, "utf8");
    const match = content.match(LOCK_TOKEN_RE);

    let lockAgeMs = Date.now() - stat.mtimeMs;
    if (match?.[3]) {
      const startedAt = Number.parseInt(match[3], 10);
      if (Number.isFinite(startedAt) && startedAt > 0) {
        lockAgeMs = Date.now() - startedAt;
      }
    }
    if (lockAgeMs > MAX_LOCK_AGE_MS) {
      return true;
    }

    if (match) {
      const pid = Number.parseInt(match[1]!, 10);
      if (Number.isFinite(pid) && pid > 0) {
        try {
          process.kill(pid, 0);
          return false;
        } catch {
          return true;
        }
      }
    }

    return lockAgeMs > STALE_ARTIFACT_TTL_MS;
  } catch {
    return true;
  }
}

async function withPromoteLock<T>(outDir: string, fn: () => Promise<T>): Promise<T> {
  const lockPath = promoteLockPath(outDir);
  await fsp.mkdir(dirname(outDir), { recursive: true });

  let lockHandle: fsp.FileHandle | undefined;
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      lockHandle = await fsp.open(lockPath, "wx");
      await lockHandle.writeFile(`${process.pid}\n${randomUUID()}\n${Date.now()}\n`, "utf8");
      break;
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
      if (code !== "EEXIST") throw err;
      if (await isStalePromoteLock(lockPath)) {
        await fsp.rm(lockPath, { force: true }).catch(/* v8 ignore next */ () => undefined);
        continue;
      }
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

async function removeStaleLegacyPromoteArtifacts(outDir: string): Promise<void> {
  const legacyTmp = `${outDir}.tmp-promote`;
  const legacyBak = `${outDir}.bak`;
  const blocked: string[] = [];

  for (const legacyPath of [legacyTmp, legacyBak]) {
    if (!(await pathExists(legacyPath))) continue;
    try {
      const stat = await fsp.stat(legacyPath);
      if (Date.now() - stat.mtimeMs > STALE_ARTIFACT_TTL_MS) {
        await fsp.rm(legacyPath, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
        continue;
      }
    } catch {
      /* v8 ignore next -- stat races are handled on next promote attempt */
    }
    blocked.push(legacyPath);
  }

  if (blocked.length) {
    const rmHint = blocked.map((p) => `rm -rf ${JSON.stringify(p)}`).join("; ");
    throw new Error(
      `[lessonkit/lxpack] cannot promote: remove stale packaging artifacts from a previous failed run: ${blocked.join(", ")}. ` +
        `Try: ${rmHint}`,
    );
  }
}

async function listRelativePaths(root: string, dir = root): Promise<string[]> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...(await listRelativePaths(root, full)));
    } else if (entry.isFile()) {
      paths.push(full.slice(root.length + 1));
    } else {
      /* v8 ignore next -- promote trees contain files and directories only */
    }
  }
  return paths;
}

async function mergePreservedOutArtifacts(
  priorArtifactsDir: string,
  destArtifactsDir: string,
  newArtifactPaths: ReadonlySet<string>,
): Promise<void> {
  if (!(await pathExists(priorArtifactsDir))) return;

  for (const rel of await listRelativePaths(priorArtifactsDir)) {
    if (newArtifactPaths.has(rel)) continue;
    const src = join(priorArtifactsDir, rel);
    const dest = join(destArtifactsDir, rel);
    await fsp.mkdir(dirname(dest), { recursive: true });
    await fsp.cp(src, dest, { force: true });
  }
}

export type PromoteStagingOptions = {
  /** Relative path under `outDir` where LMS artifacts live (default `.lxpack/out`). */
  outputBaseDir?: string;
  /** When set, re-validates `outDir` is under the project root immediately before promote. */
  projectRoot?: string;
};

/**
 * Atomically replace `outDir` with the packaged tree at `stagingDir`.
 * Preserves prior `.lxpack/out` artifacts from earlier target builds.
 * Restores the previous `outDir` when promote fails after a backup rename.
 */
/** @internal For coverage of filesystem helpers. */
export const __testPromoteFs = {
  pathExists,
  renameOrCopy,
  listRelativePaths,
  mergePreservedOutArtifacts,
  promoteLockPath,
};
export { pathExists, renameOrCopy };

export async function promoteStagingToOutDir(
  stagingDir: string,
  outDir: string,
  options?: PromoteStagingOptions,
): Promise<void> {
  const outputBaseDir = options?.outputBaseDir ?? ".lxpack/out";

  if (options?.projectRoot) {
    assertRealPathUnderRoot(resolve(options.projectRoot), resolve(outDir));
  }

  return withPromoteLock(outDir, async () => {
    await removeStaleLegacyPromoteArtifacts(outDir);

    const stagingArtifactsDir = join(stagingDir, outputBaseDir);
    const newArtifactPaths = new Set<string>();
    if (await pathExists(stagingArtifactsDir)) {
      for (const rel of await listRelativePaths(stagingArtifactsDir)) {
        newArtifactPaths.add(rel);
      }
    }

    const parent = dirname(outDir);
    let priorArtifactsBackup: string | undefined;
    const existingArtifactsDir = join(outDir, outputBaseDir);
    if ((await pathExists(outDir)) && (await pathExists(existingArtifactsDir))) {
      priorArtifactsBackup = await fsp.mkdtemp(join(parent, ".lk-prior-out-"));
      await fsp.cp(existingArtifactsDir, join(priorArtifactsBackup, outputBaseDir), { recursive: true });
    }

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
            { cause: restoreError },
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

    if (priorArtifactsBackup) {
      try {
        await mergePreservedOutArtifacts(
          join(priorArtifactsBackup, outputBaseDir),
          join(outDir, outputBaseDir),
          newArtifactPaths,
        );
      } finally {
        await fsp
          .rm(priorArtifactsBackup, { recursive: true, force: true })
          .catch(/* v8 ignore next */ () => undefined);
      }
    }

    if (backup) {
      await fsp.rm(backup, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
    }
  });
}
