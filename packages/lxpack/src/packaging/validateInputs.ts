import { isAbsolute, join, resolve, win32 } from "node:path";
import type { ExportTarget } from "@lxpack/api";
import {
  assertRealPathUnderRoot,
  isResolvedPathUnderRoot,
  isSafeRelativeSpaPath,
  relativePathUnderRoot,
  resolveComparablePath,
} from "../spaPath";
import {
  isReservedOutputPath,
  isReservedResolvedOutputPath,
} from "../validateProjectPaths";
import type { PackageLessonkitCourseOptions } from "../packageCourse";

export type PackageValidationIssue = { path?: string; message: string; severity?: string };

export type ValidatePackageInputsResult =
  | { ok: true; outDir: string; projectRoot: string }
  | { ok: false; courseDir: string; target: ExportTarget; issues: PackageValidationIssue[] };

export function validatePackageInputs(
  options: Pick<
    PackageLessonkitCourseOptions,
    "outDir" | "projectRoot" | "outputBaseDir" | "output"
  > & { target: ExportTarget },
): ValidatePackageInputsResult {
  const { target, output, outputBaseDir } = options;
  const outDir = resolve(options.outDir);

  if (!options.projectRoot) {
    return {
      ok: false,
      courseDir: outDir,
      target,
      issues: [{ path: "projectRoot", message: "projectRoot is required for packageLessonkitCourse" }],
    };
  }

  const projectRoot = resolve(options.projectRoot);

  try {
    assertRealPathUnderRoot(projectRoot, outDir);
  } catch (err) {
    return {
      ok: false,
      courseDir: outDir,
      target,
      issues: [
        {
          path: "outDir",
          message: /* v8 ignore next */ err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  if (
    isReservedOutputPath(outDir) ||
    isReservedResolvedOutputPath(projectRoot, outDir)
  ) {
    return {
      ok: false,
      courseDir: outDir,
      target,
      issues: [
        {
          path: "outDir",
          message: "outDir must not target reserved directories (.git, node_modules, .github)",
        },
      ],
    };
  }

  if (outputBaseDir && !isSafeRelativeSpaPath(outputBaseDir)) {
    return {
      ok: false,
      courseDir: outDir,
      target,
      issues: [{ path: "outputBaseDir", message: `unsafe outputBaseDir: ${outputBaseDir}` }],
    };
  }

  if (output && !isSafeRelativeSpaPath(output)) {
    if (isAbsolute(output)) {
      try {
        assertRealPathUnderRoot(projectRoot, resolve(output));
      } catch (err) {
        return {
          ok: false,
          courseDir: outDir,
          target,
          issues: [
            {
              path: "output",
              message: /* v8 ignore next */ err instanceof Error ? err.message : `unsafe output: ${output}`,
            },
          ],
        };
      }
    } else {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: [{ path: "output", message: `unsafe output: ${output}` }],
      };
    }
  }

  if (outputBaseDir) {
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
            message: /* v8 ignore next */ err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
    if (
      isReservedOutputPath(outputBaseDir) ||
      isReservedResolvedOutputPath(projectRoot, resolvedOutputBase)
    ) {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: [
          {
            path: "outputBaseDir",
            message:
              "outputBaseDir must not target reserved directories (.git, node_modules, .github)",
          },
        ],
      };
    }
  }

  if (output) {
    const resolvedOutput = isAbsolute(output) ? resolve(output) : resolve(projectRoot, output);
    try {
      assertRealPathUnderRoot(projectRoot, resolvedOutput);
    } catch (err) {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: [
          {
            path: "output",
            message: /* v8 ignore next */ err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
    const outputRel = isAbsolute(output) ? output : output;
    if (
      isReservedOutputPath(outputRel) ||
      isReservedResolvedOutputPath(projectRoot, resolvedOutput)
    ) {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: [
          {
            path: "output",
            message: "output must not target reserved directories (.git, node_modules, .github)",
          },
        ],
      };
    }
    try {
      relativePathUnderRoot(outDir, resolvedOutput);
    } catch {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: [
          {
            path: "output",
            message: "output must resolve inside outDir",
          },
        ],
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
    throw new Error(`${artifactPath} is outside the staging directory`);
  }
  const rel = relativePathUnderRoot(stagingRoot, resolved);
  /* v8 ignore start */
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`${artifactPath} is outside the staging directory`);
  }
  /* v8 ignore stop */
  if (!rel) return outDir;
  if (/^[a-zA-Z]:[/\\]/.test(outDir)) {
    return win32.join(outDir, rel.replace(/\//g, win32.sep));
  }
  /* v8 ignore next */
  return join(outDir, rel);
}
