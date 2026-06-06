import type { CliJsonResult } from "../lib/errors.js";
import { runCommand } from "../lib/exec.js";
import {
  assertViteProject,
  loadProject,
  readPackageJson,
  resolveViteJs,
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

  const buildArgs = resolveViteBuildArgs(project);
  await runCommand(process.execPath, [viteJs, ...buildArgs, ...(opts.viteArgs ?? [])], {
    cwd: project.root,
  });

  return { ok: true, command: "build", projectRoot: project.root };
}
