import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  buildCourse,
  validateCourse,
  type BuildCourseOptions,
  type BuildCourseResult,
  type ExportTarget,
  type ValidateCourseResult,
} from "@lxpack/api";
import { extractAssessments } from "./assessments";
import type { LessonkitCourseDescriptor } from "./types";
import { validateDescriptor } from "./validateDescriptor";
import { writeLxpackProject, type WriteLxpackProjectOptions } from "./writeProject";

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

export async function packageLessonkitCourse(
  options: PackageLessonkitCourseOptions,
): Promise<PackageLessonkitCourseResult> {
  const { target, output, dir, outputBaseDir, ...writeOpts } = options;
  const outDir = resolve(writeOpts.outDir);

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
  const stagingDir = await mkdtemp(join(tmpdir(), "lessonkit-lxpack-"));
  let promoted = false;

  try {
    const written = await writeLxpackProject({ ...writeOpts, descriptor, outDir: stagingDir });
    const courseDir = written.outDir;
    const assessments = extractAssessments(descriptor);

    const validation = await validateLessonkitProject({ courseDir, target });
    if (!validation.ok) {
      return {
        ok: false,
        courseDir: outDir,
        target,
        validation,
        issues: validation.issues.map((i) => ({
          path: i.path,
          message: i.message,
          severity: i.severity,
        })),
      };
    }

    const outputBase = outputBaseDir ?? ".lxpack/out";
    await mkdir(join(courseDir, outputBase), { recursive: true });

    const defaultOutput =
      output ??
      (dir ? join(outputBase, target) : join(outputBase, `course-${target}.zip`));

    const build = await buildLessonkitProject({
      courseDir,
      target,
      output: defaultOutput.startsWith("/") ? defaultOutput : join(courseDir, defaultOutput),
      dir,
      assessments: assessments.length ? assessments : undefined,
    });

    if (!build.ok) {
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

    await rm(outDir, { recursive: true, force: true });
    await mkdir(dirname(outDir), { recursive: true });
    await rename(stagingDir, outDir);
    promoted = true;

    const remapArtifactPath = (artifactPath: string | undefined): string | undefined => {
      if (!artifactPath) return undefined;
      const resolved = resolve(artifactPath);
      const stagingResolved = resolve(stagingDir);
      if (resolved === stagingResolved || resolved.startsWith(stagingResolved + "/")) {
        return join(outDir, resolved.slice(stagingResolved.length + 1));
      }
      return artifactPath;
    };

    return {
      ok: true,
      courseDir: outDir,
      target,
      outputPath: remapArtifactPath("outputPath" in build ? build.outputPath : undefined),
      outputDir: remapArtifactPath("outputDir" in build ? build.outputDir : undefined),
      fileCount: build.fileCount,
      validation,
      build,
    };
  } finally {
    if (!promoted) {
      await rm(stagingDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
