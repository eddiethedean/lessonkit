import { isAbsolute, resolve } from "node:path";
import type { DescriptorValidationIssue } from "./validateDescriptor";
import { assertResolvedPathUnderRoot, isSafeRelativeSpaPath } from "./spaPath";

export type ProjectPathsInput = {
  spaDistDir?: string;
  lxpackOutDir?: string;
  outputBaseDir?: string;
};

function validatePathField(
  value: string,
  fieldPath: string,
  projectRoot: string,
  issues: DescriptorValidationIssue[],
): void {
  if (!isSafeRelativeSpaPath(value)) {
    issues.push({
      path: fieldPath,
      message: "path must be relative without '..' segments or absolute prefixes",
    });
    return;
  }
  try {
    assertResolvedPathUnderRoot(projectRoot, resolve(projectRoot, value));
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
    validatePathField(paths.lxpackOutDir.trim(), "paths.lxpackOutDir", root, issues);
  }
  if (paths.outputBaseDir?.trim()) {
    validatePathField(paths.outputBaseDir.trim(), "paths.outputBaseDir", root, issues);
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
    assertResolvedPathUnderRoot(root, resolved);
    return resolved;
  }
  if (!isSafeRelativeSpaPath(trimmed)) {
    throw new Error(`unsafe output path: ${override}`);
  }
  const resolved = resolve(root, trimmed);
  assertResolvedPathUnderRoot(root, resolved);
  return resolved;
}
