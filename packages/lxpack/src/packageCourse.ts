import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
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
  const written = await writeLxpackProject(writeOpts);
  const courseDir = written.outDir;
  const assessments = extractAssessments(writeOpts.descriptor);

  const validation = await validateLessonkitProject({ courseDir, target });
  if (!validation.ok) {
    return {
      ok: false,
      courseDir,
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
      courseDir,
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

  return {
    ok: true,
    courseDir,
    target,
    outputPath: "outputPath" in build ? build.outputPath : undefined,
    outputDir: "outputDir" in build ? build.outputDir : undefined,
    fileCount: build.fileCount,
    validation,
    build,
  };
}
