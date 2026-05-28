import type { CliJsonResult } from "../lib/errors.js";
import { runCommand } from "../lib/exec.js";
import {
  assertViteProject,
  loadProject,
  readPackageJson,
  resolveViteBin,
} from "../lib/project.js";
import { resolveViteBuildArgs } from "../lib/paths.js";

export type DevBuildOptions = {
  cwd?: string;
  json?: boolean;
  viteArgs?: string[];
};

export async function runDev(opts: DevBuildOptions): Promise<CliJsonResult> {
  const project = await loadProject(opts.cwd ?? process.cwd());
  const pkg = await readPackageJson(project.root);
  assertViteProject(pkg, project.root);
  const viteBin = resolveViteBin(project.root);

  await runCommand(viteBin, opts.viteArgs ?? [], { cwd: project.root });

  return { ok: true, command: "dev", projectRoot: project.root };
}

export async function runBuild(opts: DevBuildOptions): Promise<CliJsonResult> {
  const project = await loadProject(opts.cwd ?? process.cwd());
  const pkg = await readPackageJson(project.root);
  assertViteProject(pkg, project.root);
  const viteBin = resolveViteBin(project.root);

  const buildArgs = resolveViteBuildArgs(project);
  await runCommand(viteBin, [...buildArgs, ...(opts.viteArgs ?? [])], { cwd: project.root });

  return { ok: true, command: "build", projectRoot: project.root };
}
