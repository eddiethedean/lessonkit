import type { CliJsonResult } from "../lib/errors.js";
import { runCommand } from "../lib/exec.js";
import {
  assertViteProject,
  loadProject,
  readPackageJson,
  resolveViteBin,
} from "../lib/project.js";

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

  await runCommand(viteBin, ["build", ...(opts.viteArgs ?? [])], { cwd: project.root });

  return { ok: true, command: "build", projectRoot: project.root };
}
