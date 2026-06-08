import { isAbsolute, resolve } from "node:path";
import type { DescriptorValidationIssue } from "./validateDescriptor";
import { assertRealPathUnderRoot, isSafeRelativeSpaPath } from "./spaPath";

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
    validatePathField(paths.spaDistDir.trim(), "paths.spaDistDir", root, issues);
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
    if (isReservedOutputPath(trimmed)) {
      throw new Error(`unsafe output path: ${override} targets a reserved directory`);
    }
    return resolved;
  }
  if (!isSafeRelativeSpaPath(trimmed)) {
    throw new Error(`unsafe output path: ${override}`);
  }
  if (isReservedOutputPath(trimmed)) {
    throw new Error(`unsafe output path: ${override} targets a reserved directory`);
  }
  const resolved = resolve(root, trimmed);
  assertRealPathUnderRoot(root, resolved);
  return resolved;
}
