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
import { validateDescriptor } from "./validateDescriptor";
import type { WriteLxpackProjectOptions } from "./writeProject";
import { remapArtifactPaths, validatePackageInputs } from "./packaging/validateInputs";
import { promoteStagingToOutDir } from "./packaging/promote";
import { buildStagingPackage, ensureOutDirParent } from "./packaging/staging";

export type { ExportTarget } from "@lxpack/api";

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
  assessments?: unknown[];
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
  return buildCourse({
    courseDir: resolve(options.courseDir),
    target: options.target,
    output: options.output,
    dir: options.dir,
    outputBaseDir: options.outputBaseDir,
    assessments: options.assessments,
  } as BuildCourseOptions);
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

  const descriptorValidation = validateDescriptor(writeOpts.descriptor);
  if (!descriptorValidation.ok) {
    return {
      ok: false,
      courseDir: outDir,
      target,
      issues: descriptorValidation.issues.map((i) => ({
        path: i.path,
        message: i.message,
      })),
    };
  }

  const descriptor = descriptorValidation.descriptor;
  const staged = await buildStagingPackage({
    ...writeOpts,
    descriptor,
    target,
    output,
    dir,
    outputBaseDir,
  });

  if (!staged.ok) {
    await fsp.rm(staged.stagingDir, { recursive: true, force: true }).catch(() => undefined);
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
  let promoted = false;

  try {
    const validation: ValidateCourseResult = {
      ok: true,
      manifest: build.manifest,
      issues: build.issues,
    };

    const stagingRoot = await fsp.realpath(stagingDir);
    const remappedOutputPath = remapArtifactPaths(stagingRoot, outDir, staged.outputPath);
    const remappedOutputDir = remapArtifactPaths(stagingRoot, outDir, staged.outputDir);

    await ensureOutDirParent(outDir);
    await promoteStagingToOutDir(stagingDir, outDir);
    promoted = true;

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
  } finally {
    if (!promoted) {
      await fsp.rm(stagingDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
