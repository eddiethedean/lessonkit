import { access, cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { descriptorToInterchange, resolveSpaLessons } from "./interchange";
import { themeToLxpackRuntime } from "./theme";
import type { LessonkitCourseDescriptor } from "./types";
import { validateDescriptor } from "./validateDescriptor";
import { emitAssessmentYaml } from "./assessmentYaml";
import { emitCourseYaml } from "./yaml";

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
};

export type WriteLxpackProjectResult = {
  outDir: string;
  courseYamlPath: string;
  lessonkitJsonPath: string;
};

async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dirname(dest), { recursive: true });
  await cp(src, dest, { recursive: true });
}

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
  await mkdir(outDir, { recursive: true });

  const spaLessons = resolveSpaLessons(descriptor);
  const runtime = descriptor.theme ? themeToLxpackRuntime(descriptor.theme) : undefined;
  const assessments = (descriptor.assessments ?? []).map((a) => ({
    id: a.checkId,
    file: `assessments/${a.checkId}.yaml`,
  }));

  if (descriptor.layout === "single-spa") {
    const srcDist = resolve(options.spaDistDir ?? descriptor.spaDistDir ?? "dist");
    try {
      await access(srcDist);
    } catch {
      throw new Error(`spaDistDir not found: ${srcDist}`);
    }
    const destDist = join(outDir, "dist");
    await copyDir(srcDist, destDist);
  } else {
    const lessonDirs = options.lessonSpaDirs ?? {};
    for (const lesson of descriptor.lessons) {
      const src = lessonDirs[lesson.id];
      if (!src) {
        throw new Error(`lessonSpaDirs missing build output for lesson "${lesson.id}"`);
      }
      const dest = join(outDir, lesson.spaPath!);
      await copyDir(resolve(src), dest);
    }
  }

  if (assessments.length) {
    const assessmentsDir = join(outDir, "assessments");
    await mkdir(assessmentsDir, { recursive: true });
    for (const assessment of descriptor.assessments ?? []) {
      await writeFile(
        join(outDir, `assessments/${assessment.checkId}.yaml`),
        emitAssessmentYaml(assessment),
        "utf-8",
      );
    }
  }

  const courseYamlPath = join(outDir, "course.yaml");
  await writeFile(
    courseYamlPath,
    emitCourseYaml({
      title: descriptor.title,
      version: descriptor.version ?? "1.0.0",
      runtime,
      tracking: descriptor.tracking,
      lessons: spaLessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: "spa",
        path: l.path,
      })),
      assessments,
    }),
    "utf-8",
  );

  const lessonkitJsonPath = join(outDir, "lessonkit.json");
  await writeFile(
    lessonkitJsonPath,
    `${JSON.stringify(descriptorToInterchange(descriptor), null, 2)}\n`,
    "utf-8",
  );

  return { outDir, courseYamlPath, lessonkitJsonPath };
}
