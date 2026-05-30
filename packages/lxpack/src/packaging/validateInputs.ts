import { join, resolve } from "node:path";
import type { ExportTarget } from "@lxpack/api";
import { assertResolvedPathUnderRoot, isSafeRelativeSpaPath } from "../spaPath";
import type { PackageLessonkitCourseOptions } from "../packageCourse";

export type PackageValidationIssue = { path?: string; message: string; severity?: string };

export type ValidatePackageInputsResult =
  | { ok: true; outDir: string; projectRoot?: string }
  | { ok: false; courseDir: string; target: ExportTarget; issues: PackageValidationIssue[] };

export function validatePackageInputs(
  options: Pick<
    PackageLessonkitCourseOptions,
    "outDir" | "projectRoot" | "outputBaseDir" | "output"
  > & { target: ExportTarget },
): ValidatePackageInputsResult {
  const { target, output, outputBaseDir } = options;
  const outDir = resolve(options.outDir);
  const projectRoot = options.projectRoot ? resolve(options.projectRoot) : undefined;

  if (projectRoot) {
    try {
      assertResolvedPathUnderRoot(projectRoot, outDir);
    } catch (err) {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: [{ path: "outDir", message: err instanceof Error ? err.message : String(err) }],
      };
    }
  }

  if (outputBaseDir && !isSafeRelativeSpaPath(outputBaseDir)) {
    return {
      ok: false,
      courseDir: outDir,
      target,
      issues: [{ path: "outputBaseDir", message: `unsafe outputBaseDir: ${outputBaseDir}` }],
    };
  }

  if (projectRoot && output) {
    const resolvedOutput = resolve(projectRoot, output);
    try {
      assertResolvedPathUnderRoot(projectRoot, resolvedOutput);
    } catch (err) {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: [{ path: "output", message: err instanceof Error ? err.message : String(err) }],
      };
    }
  }

  return { ok: true, outDir, projectRoot };
}

export function remapArtifactPaths(
  stagingRoot: string,
  outDir: string,
  artifactPath: string | undefined,
): string | undefined {
  if (!artifactPath) return undefined;
  const resolved = resolve(artifactPath);
  if (resolved === stagingRoot || resolved.startsWith(`${stagingRoot}/`)) {
    return join(outDir, resolved.slice(stagingRoot.length + 1));
  }
  return artifactPath;
}
