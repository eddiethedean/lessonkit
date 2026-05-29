import * as fsp from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  buildCourse,
  packageLessonkit,
  validateCourse,
  type BuildCourseOptions,
  type BuildCourseResult,
  type ExportTarget,
  type ValidateCourseResult,
} from "@lxpack/api";
import { descriptorToInterchange } from "./interchange";
import { resolveSpaDirs } from "./spaDirs";
import { assertResolvedPathUnderRoot, isSafeRelativeSpaPath } from "./spaPath";
import { validateDescriptor } from "./validateDescriptor";
import type { WriteLxpackProjectOptions } from "./writeProject";

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

async function pathExists(path: string): Promise<boolean> {
  try {
    await fsp.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Atomically replace `outDir` with the packaged tree at `stagingDir`.
 * Restores the previous `outDir` when promote fails after a backup rename.
 */
export async function promoteStagingToOutDir(stagingDir: string, outDir: string): Promise<void> {
  const tmpPromote = `${outDir}.tmp-promote`;
  const backup = `${outDir}.bak`;

  await fsp.rename(stagingDir, tmpPromote);

  const hadOutDir = await pathExists(outDir);
  if (hadOutDir) {
    await fsp.rename(outDir, backup);
  }

  try {
    await fsp.rename(tmpPromote, outDir);
  } catch (promoteError) {
    if (hadOutDir) {
      try {
        await fsp.rename(backup, outDir);
      } catch (restoreError) {
        console.warn(
          `[lessonkit/lxpack] failed to restore ${outDir} after promote error:`,
          restoreError instanceof Error ? restoreError.message : restoreError,
        );
      }
    }
    await fsp.rm(tmpPromote, { recursive: true, force: true }).catch(() => undefined);
    throw promoteError;
  }

  if (hadOutDir) {
    await fsp.rm(backup, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function packageLessonkitCourse(
  options: PackageLessonkitCourseOptions,
): Promise<PackageLessonkitCourseResult> {
  const { target, output, dir, outputBaseDir, ...writeOpts } = options;
  const outDir = resolve(writeOpts.outDir);
  const projectRoot = writeOpts.projectRoot ? resolve(writeOpts.projectRoot) : undefined;

  if (projectRoot) {
    assertResolvedPathUnderRoot(projectRoot, outDir);
  }
  if (outputBaseDir && !isSafeRelativeSpaPath(outputBaseDir)) {
    return {
      ok: false,
      courseDir: outDir,
      target,
      issues: [{ path: "outputBaseDir", message: `unsafe outputBaseDir: ${outputBaseDir}` }],
    };
  }

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
  const stagingDir = await fsp.mkdtemp(join(tmpdir(), "lessonkit-lxpack-"));
  let promoted = false;

  try {
    let spaDirs: Record<string, string>;
    try {
      spaDirs = await resolveSpaDirs({ ...writeOpts, descriptor });
    } catch (err) {
      return {
        ok: false,
        courseDir: outDir,
        target,
        issues: [
          {
            path: "spaDirs",
            message: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }

    const interchange = descriptorToInterchange(descriptor);
    const outputBase = outputBaseDir ?? ".lxpack/out";
    await fsp.mkdir(join(stagingDir, outputBase), { recursive: true });
    const defaultOutput =
      output ??
      (dir ? join(outputBase, target) : join(outputBase, `course-${target}.zip`));

    const build = await packageLessonkit({
      interchange,
      spaDirs,
      target,
      courseDir: stagingDir,
      output: defaultOutput,
      dir,
      outputBaseDir,
      outputAnchorDir: stagingDir,
      writeAuthoringFiles: true,
    });

    if (!build.ok) {
      const validation: ValidateCourseResult = {
        ok: false,
        issues: build.issues,
      };
      return {
        ok: false,
        courseDir: outDir,
        target,
        validation,
        build,
        issues: build.issues.map((i) => ({
          path: i.path,
          message: i.message,
          severity: i.severity,
        })),
      };
    }

    const validation: ValidateCourseResult = {
      ok: true,
      manifest: build.manifest,
      issues: build.issues,
    };

    const stagingRoot = await fsp.realpath(stagingDir);
    const remapArtifactPath = (artifactPath: string | undefined): string | undefined => {
      if (!artifactPath) return undefined;
      const resolved = resolve(artifactPath);
      if (resolved === stagingRoot || resolved.startsWith(`${stagingRoot}/`)) {
        return join(outDir, resolved.slice(stagingRoot.length + 1));
      }
      return artifactPath;
    };

    const remappedOutputPath = remapArtifactPath(
      "outputPath" in build ? build.outputPath : undefined,
    );
    const remappedOutputDir = remapArtifactPath("outputDir" in build ? build.outputDir : undefined);

    await fsp.mkdir(dirname(outDir), { recursive: true });
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
