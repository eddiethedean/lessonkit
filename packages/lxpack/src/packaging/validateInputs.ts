import { isAbsolute, join, resolve, win32 } from "node:path";
import type { ExportTarget } from "@lxpack/api";
import {
  assertRealPathUnderRoot,
  isResolvedPathUnderRoot,
  isSafeRelativeSpaPath,
  relativePathUnderRoot,
  resolveComparablePath,
} from "../spaPath";
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
      assertRealPathUnderRoot(projectRoot, outDir);
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

  if (output && !projectRoot && !isSafeRelativeSpaPath(output)) {
    return {
      ok: false,
      courseDir: outDir,
      target,
      issues: [{ path: "output", message: `unsafe output: ${output}` }],
    };
  }

  if (projectRoot && outputBaseDir) {
    const resolvedOutputBase = resolve(projectRoot, outputBaseDir);
    try {
      assertRealPathUnderRoot(projectRoot, resolvedOutputBase);
    } catch (err) {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: [
          {
            path: "outputBaseDir",
            message: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
  }

  if (projectRoot && output) {
    const resolvedOutput = resolve(projectRoot, output);
    try {
      assertRealPathUnderRoot(projectRoot, resolvedOutput);
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

export function validateArtifactInStaging(
  stagingRoot: string,
  artifactPath: string | undefined,
  field: "outputPath" | "outputDir",
): PackageValidationIssue | null {
  if (!artifactPath) return null;
  const resolved = resolveComparablePath(artifactPath);
  if (!isResolvedPathUnderRoot(stagingRoot, resolved)) {
    return {
      path: field,
      message: `${field} is outside the staging directory: ${artifactPath}`,
    };
  }
  return null;
}

export function remapArtifactPaths(
  stagingRoot: string,
  outDir: string,
  artifactPath: string | undefined,
): string | undefined {
  if (!artifactPath) return undefined;
  const resolved = resolveComparablePath(artifactPath);
  if (!isResolvedPathUnderRoot(stagingRoot, resolved)) {
    return artifactPath;
  }
  const rel = relativePathUnderRoot(stagingRoot, resolved);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return artifactPath;
  }
  if (!rel) return outDir;
  if (/^[a-zA-Z]:[/\\]/.test(outDir)) {
    return win32.join(outDir, rel.replace(/\//g, win32.sep));
  }
  return join(outDir, rel);
}
