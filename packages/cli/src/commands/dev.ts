import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { assertSpaDistContentsSafe } from "@lessonkit/lxpack";
import type { CliJsonResult } from "../lib/errors.js";
import { CliError, EXIT_INVALID_PROJECT } from "../lib/errors.js";
import { runCommand } from "../lib/exec.js";
import {
  assertViteProject,
  loadProject,
  readPackageJson,
  resolveViteJs,
} from "../lib/project.js";
import {
  resolveDistDir,
  resolveViteBuildArgv,
  stripOutDirFromViteArgs,
} from "../lib/paths.js";

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

  const devArgs = stripOutDirFromViteArgs(opts.viteArgs ?? []);
  await runCommand(process.execPath, [viteJs, ...devArgs], {
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

  const distDir = resolveDistDir(project);
  await mkdir(dirname(distDir), { recursive: true });
  if (existsSync(distDir)) {
    await assertSpaDistContentsSafe({ main: distDir }, project.root);
  }

  const buildArgs = resolveViteBuildArgv(project, opts.viteArgs);
  await runCommand(process.execPath, [viteJs, ...buildArgs], {
    cwd: project.root,
  });

  const indexHtml = join(distDir, "index.html");
  if (!existsSync(indexHtml)) {
    throw new CliError(
      `Build did not produce index.html at ${indexHtml}. Check paths.spaDistDir in lessonkit.json.`,
      { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT },
    );
  }

  return { ok: true, command: "build", projectRoot: project.root };
}
