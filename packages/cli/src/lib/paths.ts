import { resolve } from "node:path";
import { resolveSafePackageOutputOverride, type ExportTarget } from "@lessonkit/lxpack";
import { CliError, EXIT_INVALID_PROJECT } from "./errors.js";
import type { LessonkitProject } from "./project.js";
import { PACKAGE_TARGETS, type PackageTarget } from "./targetTypes.js";

export { PACKAGE_TARGETS, type PackageTarget } from "./targetTypes.js";

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
): { output: string; dir: boolean; outputBaseDir: string } {
  const outputBaseDir = project.paths.outputBaseDir;

  if (override) {
    try {
      const resolved = resolveSafePackageOutputOverride(project.root, override);
      return { output: resolved, dir: target === "standalone", outputBaseDir };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new CliError(message, { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT });
    }
  }

  if (target === "standalone") {
    return { output: `${outputBaseDir}/standalone`, dir: true, outputBaseDir };
  }
  return { output: `${outputBaseDir}/course-${target}.zip`, dir: false, outputBaseDir };
}

const DEFAULT_SPA_DIST_DIR = "dist";

export function resolveViteBuildArgs(project: LessonkitProject): string[] {
  const args = ["build"];
  if (project.paths.spaDistDir !== DEFAULT_SPA_DIST_DIR) {
    args.push("--outDir", project.paths.spaDistDir);
  }
  return args;
}

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
