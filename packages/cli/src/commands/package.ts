import { existsSync } from "node:fs";
import { packageLessonkitCourse } from "@lessonkit/lxpack";
import { runBuild } from "./dev.js";
import type { CliJsonResult } from "../lib/errors.js";
import { CliError, EXIT_INVALID_PROJECT, EXIT_PACKAGING } from "../lib/errors.js";
import {
  assertNode20ForLxpack,
  loadProject,
} from "../lib/project.js";
import {
  parsePackageTarget,
  resolveDistDir,
  resolveLxpackOutDir,
  resolvePackageOutput,
  type PackageTarget,
} from "../lib/paths.js";

export type PackageOptions = {
  target?: string;
  cwd?: string;
  noBuild?: boolean;
  out?: string;
  json?: boolean;
};

export async function runPackage(opts: PackageOptions): Promise<CliJsonResult> {
  let target: PackageTarget;
  try {
    target = parsePackageTarget(opts.target);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "TARGET_REQUIRED") {
      throw new CliError("--target is required. Example: lessonkit package --target scorm12", {
        code: "TARGET_REQUIRED",
        exitCode: EXIT_INVALID_PROJECT,
      });
    }
    throw new CliError(message, { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT });
  }

  const project = await loadProject(opts.cwd ?? process.cwd());
  const distDir = resolveDistDir(project);

  if (target === "react-vite") {
    if (!opts.noBuild || !existsSync(distDir)) {
      await runBuild({ cwd: project.root, json: opts.json });
    }
    if (!existsSync(distDir)) {
      throw new CliError(`Build completed but dist directory not found at ${distDir}.`, {
        code: "RUNTIME",
        exitCode: EXIT_INVALID_PROJECT,
      });
    }
    return { ok: true, target, projectRoot: project.root, distDir };
  }

  assertNode20ForLxpack();

  if (!opts.noBuild || !existsSync(distDir)) {
    await runBuild({ cwd: project.root, json: opts.json });
  }

  if (!existsSync(distDir)) {
    throw new CliError(`dist directory not found at ${distDir}. Run lessonkit build first.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const outDir = resolveLxpackOutDir(project);
  const { output, dir, outputBaseDir } = resolvePackageOutput(project, target, opts.out);

  const result = await packageLessonkitCourse({
    descriptor: project.course,
    outDir,
    spaDistDir: distDir,
    target,
    output,
    dir,
    outputBaseDir,
  });

  if (!result.ok) {
    throw new CliError("Packaging failed.", {
      code: "PACKAGING",
      exitCode: EXIT_PACKAGING,
      issues: result.issues,
    });
  }

  return {
    ok: true,
    target,
    projectRoot: project.root,
    outputPath: result.outputPath,
    outputDir: result.outputDir,
    fileCount: result.fileCount,
  };
}
