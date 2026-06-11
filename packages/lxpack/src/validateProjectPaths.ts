import { existsSync, realpathSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import type { DescriptorValidationIssue } from "./validateDescriptor";
import {
  assertRealPathUnderRoot,
  isSafeRelativeSpaPath,
  relativePathUnderRoot,
  resolveComparablePath,
} from "./spaPath";

export type ProjectPathsInput = {
  spaDistDir?: string;
  lxpackOutDir?: string;
  outputBaseDir?: string;
};

/** Directory names that must not be used as packaging output targets. */
const RESERVED_OUTPUT_SEGMENTS = new Set([".git", "node_modules", ".github"]);

export function isReservedOutputPath(value: string): boolean {
  let normalized = value.replace(/\\/g, "/");
  while (normalized.startsWith("/")) normalized = normalized.slice(1);
  while (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
  const segments = normalized.split("/").filter(Boolean);
  return segments.some((segment) => RESERVED_OUTPUT_SEGMENTS.has(segment));
}

/** Validate lessonkit.json `name` for safe default export/archive paths. */
export function validateManifestName(name: string): string | null {
  if (!name.length) {
    return "must be a non-empty string";
  }
  if (name.includes("/") || name.includes("\\")) {
    return "must not contain path separators";
  }
  if (!isSafeRelativeSpaPath(name)) {
    return "must be a safe relative name without '..' segments or absolute prefixes";
  }
  if (isReservedOutputPath(name) || isReservedOutputPath(`${name}.lkcourse`)) {
    return "must not target reserved directories (.git, node_modules, .github)";
  }
  return null;
}

export function isReservedResolvedOutputPath(projectRoot: string, resolved: string): boolean {
  const rootResolved = resolveComparablePath(projectRoot);
  const targetResolved = resolveComparablePath(resolved);
  try {
    const rootReal = existsSync(rootResolved) ? realpathSync(rootResolved) : rootResolved;
    const targetReal = existsSync(targetResolved) ? realpathSync(targetResolved) : targetResolved;
    const rel = relativePathUnderRoot(rootReal, targetReal);
    return isReservedOutputPath(rel);
  } catch {
    return isReservedOutputPath(resolved);
  }
}

function validatePathField(
  value: string,
  fieldPath: string,
  projectRoot: string,
  issues: DescriptorValidationIssue[],
  options?: { rejectReserved?: boolean },
): void {
  if (!isSafeRelativeSpaPath(value)) {
    issues.push({
      path: fieldPath,
      message: "path must be relative without '..' segments or absolute prefixes",
    });
    return;
  }
  if (options?.rejectReserved && isReservedOutputPath(value)) {
    issues.push({
      path: fieldPath,
      message: "path must not target reserved directories (.git, node_modules, .github)",
    });
    return;
  }
  try {
    assertRealPathUnderRoot(projectRoot, resolve(projectRoot, value));
  } catch {
    issues.push({
      path: fieldPath,
      message: "path must resolve inside the project root",
    });
  }
}

/** Validate lessonkit.json paths.* entries stay under projectRoot. */
export function validateProjectPaths(
  projectRoot: string,
  paths: ProjectPathsInput,
): DescriptorValidationIssue[] {
  const issues: DescriptorValidationIssue[] = [];
  const root = resolve(projectRoot);

  if (paths.spaDistDir?.trim()) {
    validatePathField(paths.spaDistDir.trim(), "paths.spaDistDir", root, issues, {
      rejectReserved: true,
    });
  }
  if (paths.lxpackOutDir?.trim()) {
    validatePathField(paths.lxpackOutDir.trim(), "paths.lxpackOutDir", root, issues, {
      rejectReserved: true,
    });
  }
  if (paths.outputBaseDir?.trim()) {
    validatePathField(paths.outputBaseDir.trim(), "paths.outputBaseDir", root, issues, {
      rejectReserved: true,
    });
  }

  return issues;
}

/**
 * Resolve a package --out override under projectRoot and ensure it stays inside the project.
 */
export function resolveSafePackageOutputOverride(
  projectRoot: string,
  override: string,
): string {
  const root = resolve(projectRoot);
  const trimmed = override.trim();
  if (!trimmed) {
    throw new Error("output override must be a non-empty path");
  }
  if (isAbsolute(trimmed)) {
    const resolved = resolve(trimmed);
    assertRealPathUnderRoot(root, resolved);
    if (isReservedOutputPath(trimmed) || isReservedResolvedOutputPath(root, resolved)) {
      throw new Error(`unsafe output path: ${override} targets a reserved directory`);
    }
    return resolved;
  }
  if (!isSafeRelativeSpaPath(trimmed)) {
    throw new Error(`unsafe output path: ${override}`);
  }
  const resolved = resolve(root, trimmed);
  assertRealPathUnderRoot(root, resolved);
  if (isReservedOutputPath(trimmed) || isReservedResolvedOutputPath(root, resolved)) {
    throw new Error(`unsafe output path: ${override} targets a reserved directory`);
  }
  return resolved;
}
