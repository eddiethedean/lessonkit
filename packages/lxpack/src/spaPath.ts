import { realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep, win32 } from "node:path";

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
  if (spaPath.startsWith("/") || spaPath.startsWith("\\")) return false;
  if (/^[a-zA-Z]:[/\\]/.test(spaPath)) return false;
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
    !targetResolved.startsWith(win32Prefix)
  ) {
    throw new Error(`unsafe path escapes project root: ${target}`);
  }
}

/** True when `target` resolves to `root` or a path under `root` (cross-platform). */
/** Resolve symlinks on `root` and ensure `target` stays under it (including non-existent paths). */
export function assertRealPathUnderRoot(root: string, target: string): void {
  const rootResolved = resolveComparablePath(root);
  const targetResolved = resolveComparablePath(target);
  let rootReal: string;
  try {
    rootReal = realpathSync(rootResolved);
  } catch {
    rootReal = rootResolved;
  }
  let targetCheck: string;
  try {
    targetCheck = realpathSync(targetResolved);
  } catch {
    const rel = relative(rootResolved, targetResolved);
    if (rel.startsWith("..") || rel.includes(`..${sep}`)) {
      throw new Error(`unsafe path escapes project root: ${target}`);
    }
    targetCheck = resolve(rootReal, rel);
  }
  assertResolvedPathUnderRoot(rootReal, targetCheck);
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
  if (!rel) return true;
  return !rel.startsWith("..") && !isAbsolute(rel);
}
