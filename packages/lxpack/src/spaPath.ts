import { resolve, sep } from "node:path";

/** Relative SPA output path safe to join under an LXPack project root. */
export function isSafeRelativeSpaPath(spaPath: string): boolean {
  if (!spaPath.length || spaPath.includes("\0")) return false;
  if (spaPath.startsWith("/") || spaPath.startsWith("\\")) return false;
  if (/^[a-zA-Z]:[/\\]/.test(spaPath)) return false;
  const segments = spaPath.split(/[/\\]/);
  if (segments.some((s) => s === "..")) return false;
  return true;
}

export function assertResolvedPathUnderRoot(root: string, target: string): void {
  const rootResolved = resolve(root);
  const targetResolved = resolve(target);
  const prefix = rootResolved.endsWith(sep) ? rootResolved : rootResolved + sep;
  if (targetResolved !== rootResolved && !targetResolved.startsWith(prefix)) {
    throw new Error(`unsafe path escapes project root: ${target}`);
  }
}
