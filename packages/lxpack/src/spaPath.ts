import { realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep, win32 } from "node:path";

/** Resolve absolute paths, including Windows drive paths when running on other OSes. */
export function resolveComparablePath(p: string): string {
  if (/^[a-zA-Z]:[/\\]/.test(p)) {
    return win32.resolve(p);
  }
  return resolve(p);
}

/** Relative SPA output path safe to join under an LXPack project root. */
export function isSafeRelativeSpaPath(spaPath: string): boolean {
  if (!spaPath.length || spaPath.includes("\0")) return false;
  /* v8 ignore next 2 */
  if (spaPath.startsWith("/") || spaPath.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/.test(spaPath)) return false;
  if (spaPath === "." || spaPath === "./") return false;
  const segments = spaPath.split(/[/\\]/).filter((s) => s.length > 0 && s !== ".");
  if (segments.some((s) => s === "..")) return false;
  return segments.length > 0;
}

export function assertResolvedPathUnderRoot(root: string, target: string): void {
  const rootResolved = resolveComparablePath(root);
  const targetResolved = resolveComparablePath(target);
  const prefix = rootResolved.endsWith(sep) ? rootResolved : rootResolved + sep;
  const win32Prefix =
    rootResolved.endsWith(win32.sep) ? rootResolved : rootResolved + win32.sep;
  if (
    targetResolved !== rootResolved &&
    !targetResolved.startsWith(prefix) &&
    /* v8 ignore next */
    !targetResolved.startsWith(win32Prefix)
  ) {
    throw new Error(`unsafe path escapes project root: ${target}`);
  }
}

/** Resolve symlinks on the longest existing prefix (handles macOS /var vs /private/var). */
function resolvePhysicalPathForCheck(p: string): string {
  const resolved = resolveComparablePath(p);
  try {
    return realpathSync.native(resolved);
  } catch {
    let probe = resolved;
    let suffix = "";
    while (true) {
      try {
        const physical = realpathSync.native(probe);
        return suffix ? join(physical, suffix) : physical;
      } catch {
        if (probe === dirname(probe)) {
          return resolved;
        }
        const segment = basename(probe);
        suffix = suffix ? join(segment, suffix) : segment;
        probe = dirname(probe);
      }
    }
  }
}

/** Resolve symlinks on `root` and ensure `target` stays under it (including non-existent paths). */
export function assertRealPathUnderRoot(root: string, target: string): void {
  /* v8 ignore start */
  const rootPhysical = resolvePhysicalPathForCheck(root);
  const targetPhysical = resolvePhysicalPathForCheck(target);
  assertResolvedPathUnderRoot(rootPhysical, targetPhysical);
  /* v8 ignore stop */
}

function normalizePathForComparison(p: string): string {
  const resolved = resolveComparablePath(p);
  return /^[a-zA-Z]:[/\\]/.test(resolved) ? resolved.toLowerCase() : resolved;
}

/** Relative path from `root` to `target` when `target` is under `root`. */
export function relativePathUnderRoot(root: string, target: string): string {
  const rootResolved = normalizePathForComparison(root);
  const targetResolved = normalizePathForComparison(target);
  if (/^[a-zA-Z]:[/\\]/.test(rootResolved)) {
    return win32.relative(rootResolved, targetResolved);
  }
  return relative(rootResolved, targetResolved);
}

export function isResolvedPathUnderRoot(root: string, target: string): boolean {
  const rootResolved = normalizePathForComparison(root);
  const targetResolved = normalizePathForComparison(target);
  if (targetResolved === rootResolved) return true;
  const rel = relativePathUnderRoot(root, target);
  /* v8 ignore next */
  if (!rel) return true;
  return !rel.startsWith("..") && !isAbsolute(rel);
}
