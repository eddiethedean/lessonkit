import { lstat, readdir } from "node:fs/promises";
import { join } from "node:path";
import { assertRealPathUnderRoot } from "./spaPath";

/**
 * Reject symlinks and paths escaping dist roots before packaging LMS artifacts.
 */
export async function assertSpaDistContentsSafe(
  spaDirs: Record<string, string>,
  projectRoot?: string,
): Promise<void> {
  for (const [label, dir] of Object.entries(spaDirs)) {
    if (projectRoot) {
      assertRealPathUnderRoot(projectRoot, dir);
    }
    await walkDistDir(dir, dir, label);
  }
}

async function walkDistDir(rootReal: string, current: string, label: string): Promise<void> {
  let entries;
  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch (err) {
    throw new Error(
      `spa dist for "${label}" is not readable: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  for (const entry of entries) {
    const entryPath = join(current, entry.name);
    const stat = await lstat(entryPath);
    if (stat.isSymbolicLink()) {
      throw new Error(`spa dist for "${label}" contains symlink: ${entryPath}`);
    }
    assertRealPathUnderRoot(rootReal, entryPath);
    if (stat.isDirectory()) {
      await walkDistDir(rootReal, entryPath, label);
    }
  }
}
