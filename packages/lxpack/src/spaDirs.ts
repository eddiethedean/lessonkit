import { access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { resolveSpaLessons } from "./interchange";
import { assertRealPathUnderRoot } from "./spaPath";
import type { LessonkitCourseDescriptor } from "./types";
import type { WriteLxpackProjectOptions } from "./writeProject";

export type ResolveSpaDirsOptions = Pick<
  WriteLxpackProjectOptions,
  "spaDistDir" | "lessonSpaDirs" | "projectRoot"
> & {
  descriptor: LessonkitCourseDescriptor;
};

/**
 * Map SPA lesson ids to absolute folders containing `index.html` for `packageLessonkit()`.
 */
export async function resolveSpaDirs(
  options: ResolveSpaDirsOptions,
): Promise<Record<string, string>> {
  const { descriptor, spaDistDir, lessonSpaDirs, projectRoot } = options;
  const spaLessons = resolveSpaLessons(descriptor);

  if (descriptor.layout === "single-spa") {
    const spaDistRelative = spaDistDir ?? descriptor.spaDistDir ?? "dist";
    const srcDist = projectRoot
      ? resolve(projectRoot, spaDistRelative)
      : resolve(spaDistRelative);
    if (projectRoot) {
      assertRealPathUnderRoot(resolve(projectRoot), srcDist);
    }
    try {
      await access(srcDist);
    } catch {
      throw new Error(`spaDistDir not found: ${srcDist}`);
    }
    try {
      await access(join(srcDist, "index.html"));
    } catch {
      throw new Error(`spaDistDir must contain index.html: ${join(srcDist, "index.html")}`);
    }
    const lessonId = spaLessons[0]?.id ?? "main";
    return { [lessonId]: srcDist };
  }

  const dirs: Record<string, string> = {};
  const lessonDirs = lessonSpaDirs ?? {};
  for (const lesson of descriptor.lessons) {
    const src = lessonDirs[lesson.id];
    if (!src) {
      throw new Error(`lessonSpaDirs missing build output for lesson "${lesson.id}"`);
    }
    const resolved = projectRoot ? resolve(projectRoot, src) : resolve(src);
    if (projectRoot) {
      assertRealPathUnderRoot(resolve(projectRoot), resolved);
    }
    try {
      await access(resolved);
    } catch {
      throw new Error(`lessonSpaDirs path not found for lesson "${lesson.id}": ${resolved}`);
    }
    try {
      await access(join(resolved, "index.html"));
    } catch {
      throw new Error(
        `lessonSpaDirs must contain index.html for lesson "${lesson.id}": ${join(resolved, "index.html")}`,
      );
    }
    dirs[lesson.id] = resolved;
  }
  return dirs;
}
