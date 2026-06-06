import { resolve } from "node:path";
import * as fsp from "node:fs/promises";
import {
  buildCourse,
  validateCourse,
  type BuildCourseOptions,
  type BuildCourseResult,
  type ExportTarget,
  type ValidateCourseResult,
} from "@lxpack/api";
import { validateDescriptorForTarget } from "./validateDescriptor";
import type { LxpackInjectedAssessment } from "./assessments";
import type { WriteLxpackProjectOptions } from "./writeProject";
import {
  remapArtifactPaths,
  validateArtifactInStaging,
  validatePackageInputs,
} from "./packaging/validateInputs";
import { promoteStagingToOutDir } from "./packaging/promote";
import { buildStagingPackage, ensureOutDirParent } from "./packaging/staging";
import { findPackagingErrorIssues } from "./packaging/issueSeverity";
import { validateReactManifestParity } from "./validateReactParity";

export type { ExportTarget } from "@lxpack/api";

/** LessonKit-owned alias for LMS export targets (maps to `@lxpack/api` `ExportTarget`). */
export type LessonkitExportTarget = ExportTarget;

export type ValidateLessonkitProjectOptions = {
  courseDir: string;
  target?: ExportTarget;
};

export type BuildLessonkitProjectOptions = {
  courseDir: string;
  target: ExportTarget;
  output?: string;
  dir?: boolean;
  outputBaseDir?: string;
  assessments?: LxpackInjectedAssessment[];
};

export type PackageLessonkitCourseOptions = WriteLxpackProjectOptions & {
  target: ExportTarget;
  /** Output zip or directory path (must stay inside `outDir` for LXPack). */
  output?: string;
  dir?: boolean;
  outputBaseDir?: string;
};

export type PackageLessonkitCourseResult =
  | {
      ok: true;
      courseDir: string;
      target: ExportTarget;
      outputPath?: string;
      outputDir?: string;
      fileCount: number;
      validation: ValidateCourseResult;
      build: BuildCourseResult;
    }
  | {
      ok: false;
      courseDir: string;
      target: ExportTarget;
      validation?: ValidateCourseResult;
      build?: BuildCourseResult;
      issues: Array<{ path?: string; message: string; severity?: string }>;
    };

export async function validateLessonkitProject(
  options: ValidateLessonkitProjectOptions,
): Promise<ValidateCourseResult> {
  return validateCourse({
    courseDir: resolve(options.courseDir),
    target: options.target,
  });
}

export async function buildLessonkitProject(
  options: BuildLessonkitProjectOptions,
): Promise<BuildCourseResult> {
  const buildOptions: BuildCourseOptions = {
    courseDir: resolve(options.courseDir),
    target: options.target,
    output: options.output,
    dir: options.dir,
    outputBaseDir: options.outputBaseDir,
    assessments: options.assessments,
  };
  return buildCourse(buildOptions);
}

export { promoteStagingToOutDir } from "./packaging/promote";
export { buildStagingPackage, ensureOutDirParent } from "./packaging/staging";

export async function packageLessonkitCourse(
  options: PackageLessonkitCourseOptions,
): Promise<PackageLessonkitCourseResult> {
  const { target, output, dir, outputBaseDir, ...writeOpts } = options;

  const inputValidation = validatePackageInputs({
    target,
    output,
    outputBaseDir,
    outDir: writeOpts.outDir,
    projectRoot: writeOpts.projectRoot,
  });
  if (!inputValidation.ok) {
    return {
      ok: false,
      courseDir: inputValidation.courseDir,
      target: inputValidation.target,
      issues: inputValidation.issues,
    };
  }
  const outDir = inputValidation.outDir;

  const descriptorValidation = validateDescriptorForTarget(writeOpts.descriptor, target);
  if (!descriptorValidation.ok) {
    return {
      ok: false,
      courseDir: resolve(writeOpts.outDir),
      target,
      issues: descriptorValidation.issues.map((i) => ({
        path: i.path,
        message: i.message,
      })),
    };
  }

  const descriptor = descriptorValidation.descriptor;

  if (writeOpts.projectRoot) {
    const parityIssues = validateReactManifestParity({
      projectRoot: writeOpts.projectRoot,
      descriptor,
    });
    const parityErrors = parityIssues.filter((i) => i.severity === "error");
    if (parityErrors.length > 0) {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: parityErrors.map((i) => ({
          path: i.path,
          message: i.message,
          severity: i.severity,
        })),
      };
    }
  }

  const staged = await buildStagingPackage({
    ...writeOpts,
    descriptor,
    target,
    output,
    dir,
    outputBaseDir,
  });

  if (!staged.ok) {
    await fsp.rm(staged.stagingDir, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
    const validation: ValidateCourseResult | undefined = staged.build
      ? { ok: false, issues: staged.build.issues }
      : undefined;
    return {
      ok: false,
      courseDir: outDir,
      target,
      validation,
      build: staged.build,
      issues: staged.issues,
    };
  }

  const { stagingDir, build } = staged;

  const buildErrorIssues = findPackagingErrorIssues(build.issues);
  if (buildErrorIssues.length > 0) {
    await fsp.rm(stagingDir, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
    return {
      ok: false,
      courseDir: outDir,
      target,
      validation: { ok: false, manifest: build.manifest, issues: build.issues },
      build,
      issues: build.issues
        .filter((i) => findPackagingErrorIssues([i]).length > 0)
        .map((i) => ({
          path: i.path ?? "build",
          message: i.message,
          severity: i.severity,
        })),
    };
  }

  const stagingRoot = await fsp.realpath(stagingDir);
  const artifactIssues = [
    validateArtifactInStaging(stagingRoot, staged.outputPath, "outputPath"),
    validateArtifactInStaging(stagingRoot, staged.outputDir, "outputDir"),
  ].filter((issue): issue is NonNullable<typeof issue> => issue != null);

  if (artifactIssues.length > 0) {
    await fsp.rm(stagingDir, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
    return {
      ok: false,
      courseDir: outDir,
      target,
      validation: { ok: true, manifest: build.manifest, issues: build.issues },
      build,
      issues: artifactIssues,
    };
  }

  const remappedOutputPath = remapArtifactPaths(stagingRoot, outDir, staged.outputPath);
  const remappedOutputDir = remapArtifactPaths(stagingRoot, outDir, staged.outputDir);

  const validation: ValidateCourseResult = {
    ok: true,
    manifest: build.manifest,
    issues: build.issues,
  };

  try {
    await ensureOutDirParent(outDir);
    await promoteStagingToOutDir(stagingDir, outDir);
  } catch (err) {
    await fsp.rm(stagingDir, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
    return {
      ok: false,
      courseDir: outDir,
      target,
      validation,
      build,
      issues: [
        {
          path: "promote",
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }

  const remappedBuild: BuildCourseResult = { ...build };
  if ("outputPath" in remappedBuild && remappedOutputPath !== undefined) {
    remappedBuild.outputPath = remappedOutputPath;
  }
  if ("outputDir" in remappedBuild && remappedOutputDir !== undefined) {
    remappedBuild.outputDir = remappedOutputDir;
  }

  return {
    ok: true,
    courseDir: outDir,
    target,
    outputPath: remappedOutputPath,
    outputDir: remappedOutputDir,
    fileCount: build.fileCount,
    validation,
    build: remappedBuild,
  };
}
