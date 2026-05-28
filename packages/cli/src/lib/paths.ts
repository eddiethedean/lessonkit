import { resolve } from "node:path";
import type { ExportTarget } from "@lessonkit/lxpack";
import type { LessonkitProject } from "./project.js";

export function resolveDistDir(project: LessonkitProject): string {
  return resolve(project.root, project.paths.spaDistDir);
}

export function resolveLxpackOutDir(project: LessonkitProject): string {
  return resolve(project.root, project.paths.lxpackOutDir);
}

export function resolvePackageOutput(
  project: LessonkitProject,
  target: ExportTarget,
  override?: string,
): { output: string; dir: boolean } {
  if (override) {
    return { output: override, dir: target === "standalone" };
  }

  if (target === "standalone") {
    return { output: ".lxpack/out/standalone", dir: true };
  }
  return { output: `.lxpack/out/course-${target}.zip`, dir: false };
}

export const PACKAGE_TARGETS = [
  "react-vite",
  "scorm12",
  "scorm2004",
  "xapi",
  "cmi5",
  "standalone",
] as const;

export type PackageTarget = (typeof PACKAGE_TARGETS)[number];

export function parsePackageTarget(value: string | undefined): PackageTarget {
  if (!value) {
    throw new Error("TARGET_REQUIRED");
  }
  if ((PACKAGE_TARGETS as readonly string[]).includes(value)) {
    return value as PackageTarget;
  }
  throw new Error(`Unknown target "${value}". Valid targets: ${PACKAGE_TARGETS.join(", ")}`);
}

export function isLxpackTarget(target: PackageTarget): target is ExportTarget {
  return target !== "react-vite";
}
