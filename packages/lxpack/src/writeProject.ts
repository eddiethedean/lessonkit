import { join, resolve } from "node:path";
import { materializeLessonkitProject } from "@lxpack/validators";
import { descriptorToInterchange } from "./interchange";
import { resolveSpaDirs } from "./spaDirs";
import type { LessonkitCourseDescriptor } from "./types";
import { assertRealPathUnderRoot } from "./spaPath";
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
  /** When set, relative `spaDistDir` is resolved under this directory instead of `process.cwd()`. */
  projectRoot?: string;
};

export type WriteLxpackProjectResult = {
  outDir: string;
  courseYamlPath: string;
  lessonkitJsonPath: string;
};

/**
 * Materialize an LXPack project tree from a LessonKit descriptor (delegates to LXPack 0.6+).
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
  const outDir = resolve(options.outDir);
  if (options.projectRoot) {
    assertRealPathUnderRoot(resolve(options.projectRoot), outDir);
  }
  const spaDirs = await resolveSpaDirs({ ...options, descriptor });
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
