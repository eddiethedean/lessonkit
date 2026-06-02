import { spawn } from "node:child_process";
import { resolve } from "node:path";
import {
  packageLessonkitCourse,
  writeLxpackProject,
  type ExportTarget,
  type PackageLessonkitCourseResult,
} from "@lessonkit/lxpack";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { generateExportFiles } from "./generateReactVite";
import { studioProjectToDescriptor } from "./toDescriptor";
import type { PackageStudioOptions, StudioExportOptions } from "./types";
import {
  collectRelativeAssetPaths,
  copyAssetFiles,
  writeGeneratedFiles,
} from "./writeProject";
import { assertExportableProject } from "./validateExport";

async function runCommand(cwd: string, command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

export type WriteReactViteProjectOptions = StudioExportOptions & {
  outDir: string;
};

export async function writeReactViteProject(
  project: StudioProjectV1,
  options: WriteReactViteProjectOptions,
): Promise<{ outDir: string; files: ReturnType<typeof generateExportFiles> }> {
  const validated = assertExportableProject(project, options);
  if (!validated.ok) {
    throw new Error(validated.issues.map((i) => `${i.path}: ${i.message}`).join("; "));
  }

  const files = generateExportFiles(validated.project, options);
  await writeGeneratedFiles(options.outDir, files);

  if (options.assetsDir) {
    const assetPaths = collectRelativeAssetPaths(files);
    if (assetPaths.length) {
      await copyAssetFiles(options.assetsDir, options.outDir, assetPaths);
    }
  }

  return { outDir: options.outDir, files };
}

export type WriteLxpackFromStudioOptions = StudioExportOptions & {
  outDir: string;
  spaDistDir?: string;
  projectRoot?: string;
};

export async function writeLxpackProjectFromStudio(
  project: StudioProjectV1,
  options: WriteLxpackFromStudioOptions,
): Promise<Awaited<ReturnType<typeof writeLxpackProject>>> {
  const validated = assertExportableProject(project, options);
  if (!validated.ok) {
    throw new Error(validated.issues.map((i) => `${i.path}: ${i.message}`).join("; "));
  }

  const descriptor = studioProjectToDescriptor(validated.project, options);
  return writeLxpackProject({
    descriptor,
    outDir: options.outDir,
    spaDistDir: options.spaDistDir ?? options.paths?.spaDistDir ?? "dist",
    projectRoot: options.projectRoot,
  });
}

export async function packageStudioProject(
  project: StudioProjectV1,
  options: PackageStudioOptions,
): Promise<PackageLessonkitCourseResult> {
  const validated = assertExportableProject(project, options);
  if (!validated.ok) {
    return {
      ok: false,
      courseDir: resolve(options.outDir),
      target: options.target,
      issues: validated.issues.map((i) => ({ path: i.path, message: i.message })),
    };
  }

  const projectDir = resolve(options.outDir);
  await writeReactViteProject(validated.project, { ...options, outDir: projectDir });

  await runCommand(projectDir, "npm", ["install"]);
  await runCommand(projectDir, "npm", ["run", "build"]);

  const descriptor = studioProjectToDescriptor(validated.project, options);
  const lxpackOutDir = resolve(projectDir, options.paths?.lxpackOutDir ?? ".lxpack/course");

  return packageLessonkitCourse({
    descriptor,
    outDir: lxpackOutDir,
    spaDistDir: resolve(projectDir, options.paths?.spaDistDir ?? "dist"),
    projectRoot: options.projectRoot ?? projectDir,
    target: options.target,
    output: options.output,
    dir: options.dir,
    outputBaseDir: options.paths?.outputBaseDir,
  });
}

export type { ExportTarget };
