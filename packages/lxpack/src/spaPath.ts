import { resolve, sep, win32 } from "node:path";

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
  const segments = spaPath.split(/[/\\]/).filter((s) => s.length > 0);
  if (segments.some((s) => s === "..")) return false;
  return true;
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
export function isResolvedPathUnderRoot(root: string, target: string): boolean {
  const rootResolved = resolveComparablePath(root);
  const targetResolved = resolveComparablePath(target);
  if (targetResolved === rootResolved) return true;
  const prefix = rootResolved.endsWith(sep) ? rootResolved : rootResolved + sep;
  const win32Prefix =
    rootResolved.endsWith(win32.sep) ? rootResolved : rootResolved + win32.sep;
  return targetResolved.startsWith(prefix) || targetResolved.startsWith(win32Prefix);
}
