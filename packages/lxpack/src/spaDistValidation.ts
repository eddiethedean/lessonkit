import { lstat, readdir } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { join } from "node:path";
import { assertRealPathUnderRoot, assertResolvedPathUnderRoot, resolveComparablePath } from "./spaPath";

/**
 * Reject symlinks and paths escaping dist roots before packaging LMS artifacts.
 */
export async function assertSpaDistContentsSafe(
  spaDirs: Record<string, string>,
  projectRoot?: string,
): Promise<void> {
  for (const [label, dir] of Object.entries(spaDirs)) {
    const dirResolved = resolveComparablePath(dir);
    const dirStat = await lstat(dirResolved);
    if (dirStat.isSymbolicLink()) {
      throw new Error(`spa dist for "${label}" cannot be a symlink: ${dir}`);
    }
    let rootReal: string;
    try {
      rootReal = realpathSync(dirResolved);
    } catch {
      throw new Error(`spa dist for "${label}" is not readable: ${dir}`);
    }
    if (projectRoot) {
      assertRealPathUnderRoot(projectRoot, dir);
    }
    assertResolvedPathUnderRoot(rootReal, rootReal);
    await walkDistDir(rootReal, rootReal, label);
  }
}

async function walkDistDir(rootReal: string, current: string, label: string): Promise<void> {
  let entries;
  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch (err) {
    throw new Error(
      `spa dist for "${label}" is not readable: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }

  for (const entry of entries) {
    const entryPath = join(current, entry.name);
    const stat = await lstat(entryPath);
    if (stat.isSymbolicLink()) {
      throw new Error(`spa dist for "${label}" contains symlink: ${entryPath}`);
    }
    let entryReal: string;
    try {
      entryReal = realpathSync(entryPath);
    } catch (err) {
      throw new Error(
        `spa dist for "${label}" could not resolve path: ${entryPath}`,
        { cause: err },
      );
    }
    assertResolvedPathUnderRoot(rootReal, entryReal);
    if (stat.isDirectory()) {
      await walkDistDir(rootReal, entryPath, label);
    }
  }
}
