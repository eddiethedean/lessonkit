import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CliJsonResult } from "../lib/errors.js";
import { CliError, EXIT_INVALID_PROJECT } from "../lib/errors.js";
import { runCommand } from "../lib/exec.js";
import {
  assertViteProject,
  loadProject,
  readPackageJson,
  resolveViteJs,
} from "../lib/project.js";
import { resolveDistDir, resolveViteBuildArgv } from "../lib/paths.js";

export type DevBuildOptions = {
  cwd?: string;
  json?: boolean;
  viteArgs?: string[];
};

export async function runDev(opts: DevBuildOptions): Promise<CliJsonResult> {
  const project = await loadProject(opts.cwd ?? process.cwd());
  const pkg = await readPackageJson(project.root);
  assertViteProject(pkg, project.root);
  const viteJs = resolveViteJs(project.root);

  await runCommand(process.execPath, [viteJs, ...(opts.viteArgs ?? [])], {
    cwd: project.root,
    timeoutMs: 0,
  });

  return { ok: true, command: "dev", projectRoot: project.root };
}

export async function runBuild(opts: DevBuildOptions): Promise<CliJsonResult> {
  const project = await loadProject(opts.cwd ?? process.cwd());
  const pkg = await readPackageJson(project.root);
  assertViteProject(pkg, project.root);
  const viteJs = resolveViteJs(project.root);

  const buildArgs = resolveViteBuildArgv(project, opts.viteArgs);
  await runCommand(process.execPath, [viteJs, ...buildArgs], {
    cwd: project.root,
  });

  const distDir = resolveDistDir(project);
  const indexHtml = join(distDir, "index.html");
  if (!existsSync(indexHtml)) {
    throw new CliError(
      `Build did not produce index.html at ${indexHtml}. Check paths.spaDistDir in lessonkit.json.`,
      { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT },
    );
  }

  return { ok: true, command: "build", projectRoot: project.root };
}
