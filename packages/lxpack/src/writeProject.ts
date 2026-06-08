import { join, resolve } from "node:path";
import { materializeLessonkitProject } from "@lxpack/validators";
import { descriptorToInterchange } from "./interchange";
import { resolveSpaDirs } from "./spaDirs";
import { assertSpaDistContentsSafe } from "./spaDistValidation";
import type { LessonkitCourseDescriptor } from "./types";
import { assertRealPathUnderRoot } from "./spaPath";
import { validateInjectableAssessments } from "./descriptor/validateInjectableAssessments";
import { validateDescriptor } from "./validateDescriptor";
export type WriteLxpackProjectOptions = {
  descriptor: LessonkitCourseDescriptor;
  /** LXPack project output directory (created if missing). */
  outDir: string;
  /**
   * Absolute or cwd-relative path to the built SPA for `single-spa`
   * (defaults to `descriptor.spaDistDir` or `./dist`).
   */
  spaDistDir?: string;
  /**
   * For `per-lesson-spa`: map lesson id → absolute path to that lesson's built SPA folder.
   */
  lessonSpaDirs?: Record<string, string>;
  /** Project root used to resolve relative SPA paths and confine output directories. */
  projectRoot: string;
};

export type WriteLxpackProjectResult = {
  outDir: string;
  courseYamlPath: string;
  lessonkitJsonPath: string;
};

/**
 * Materialize an LXPack project tree from a LessonKit descriptor (delegates to LXPack 0.6+).
 *
 * @example
 * ```ts
 * import { writeLxpackProject } from "@lessonkit/lxpack";
 *
 * await writeLxpackProject({
 *   descriptor: courseFromLessonkitJson,
 *   outDir: ".lxpack/course",
 *   spaDistDir: "dist",
 *   projectRoot: process.cwd(),
 * });
 * ```
 */
export async function writeLxpackProject(
  options: WriteLxpackProjectOptions,
): Promise<WriteLxpackProjectResult> {
  const validation = validateDescriptor(options.descriptor);
  if (!validation.ok) {
    throw new Error(
      validation.issues.map((i) => `${i.path}: ${i.message}`).join("; "),
    );
  }

  const descriptor = validation.descriptor;

  const injectableIssues = validateInjectableAssessments(descriptor);
  if (injectableIssues.length > 0) {
    throw new Error(
      injectableIssues.map((i) => `${i.path ?? "assessments"}: ${i.message}`).join("; "),
    );
  }

  const outDir = resolve(options.outDir);
  assertRealPathUnderRoot(resolve(options.projectRoot), outDir);
  const spaDirs = await resolveSpaDirs({ ...options, descriptor });
  await assertSpaDistContentsSafe(spaDirs, options.projectRoot);
  const interchange = descriptorToInterchange(descriptor);

  const materialized = await materializeLessonkitProject({
    interchange,
    spaDirs,
    courseDir: outDir,
    writeAuthoringFiles: true,
  });

  if (!materialized.ok) {
    throw new Error(
      materialized.issues
        .map((i) => `${i.path ?? ""}: ${i.message}`.trim())
        .join("; "),
    );
  }

  const courseDir = materialized.courseDir;
  return {
    outDir: courseDir,
    courseYamlPath: join(courseDir, "course.yaml"),
    lessonkitJsonPath: join(courseDir, "lessonkit.json"),
  };
}
