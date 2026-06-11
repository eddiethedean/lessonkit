import * as fsp from "node:fs/promises";
import { join } from "node:path";
import { GOLDEN_DIR } from "./paths";

const E2E_STAGING_DIR_NAMES = [
  "e2e-standalone-course",
  "e2e-scorm-course",
  "e2e-scorm2004-course",
  "e2e-xapi-course",
  "e2e-cmi5-course",
] as const;

const PROMOTE_ARTIFACT_PREFIXES = [
  ".lk-promote-",
  ".lk-backup-",
  ".lk-prior-out-",
  ".lk-failed-promote-",
  ".lk-promote-lock-",
] as const;

/** Relocated standalone output from global-setup (`output: ".lxpack/out/standalone"`). */
export const E2E_RELOCATED_STANDALONE_DIR = join(GOLDEN_DIR, ".lxpack/out/standalone");

export function e2eGoldenStagingDirs(): string[] {
  return E2E_STAGING_DIR_NAMES.map((name) => join(GOLDEN_DIR, ".lxpack", name));
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await fsp.access(path);
    return true;
  } catch {
    return false;
  }
}

async function removePath(path: string): Promise<void> {
  if (!(await pathExists(path))) return;
  await fsp.rm(path, { recursive: true, force: true });
}

async function removePromoteArtifactsUnder(lxpackRoot: string): Promise<void> {
  if (!(await pathExists(lxpackRoot))) return;

  const entries = await fsp.readdir(lxpackRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isFile()) continue;
    if (!PROMOTE_ARTIFACT_PREFIXES.some((prefix) => entry.name.startsWith(prefix))) continue;
    await removePath(join(lxpackRoot, entry.name));
  }

  for (const legacyName of ["standalone.tmp-promote", "standalone.bak"]) {
    await removePath(join(lxpackRoot, "out", legacyName));
  }
}

export type CleanupE2eGoldenPackagingOptions = {
  /** Remove relocated standalone dir (needed before re-packaging). */
  relocatedStandalone?: boolean;
};

/**
 * Remove lxpack-golden paths left by E2E global setup / packaging promote.
 * Safe to run before rebuild (avoids ENOTEMPTY on standalone relocate) and after tests.
 */
export async function cleanupE2eGoldenPackagingArtifacts(
  options: CleanupE2eGoldenPackagingOptions = {},
): Promise<void> {
  const { relocatedStandalone = false } = options;

  for (const stagingDir of e2eGoldenStagingDirs()) {
    await removePath(stagingDir);
  }

  if (relocatedStandalone) {
    await removePath(E2E_RELOCATED_STANDALONE_DIR);
  }

  await removePromoteArtifactsUnder(join(GOLDEN_DIR, ".lxpack"));
}
