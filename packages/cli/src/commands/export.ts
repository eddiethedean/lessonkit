import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { exportLkcourse, resolveSafePackageOutputOverride } from "@lessonkit/lxpack";
import { runBuild } from "./dev.js";
import type { CliJsonResult } from "../lib/errors.js";
import { CliError, EXIT_INVALID_PROJECT, EXIT_PACKAGING } from "../lib/errors.js";
import { loadProject } from "../lib/project.js";

export type ExportOptions = {
  cwd?: string;
  out?: string;
  noBuild?: boolean;
  withBlockTree?: boolean;
  json?: boolean;
};

function resolveExportOutput(projectRoot: string, override?: string, defaultName?: string): string {
  if (override) {
    try {
      return resolveSafePackageOutputOverride(projectRoot, override);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new CliError(message, { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT });
    }
  }
  return resolve(projectRoot, `${defaultName ?? "course"}.lkcourse`);
}

export async function runExport(opts: ExportOptions): Promise<CliJsonResult> {
  const project = await loadProject(opts.cwd ?? process.cwd());
  const distDir = resolve(project.root, project.paths.spaDistDir);

  if (opts.noBuild && !existsSync(distDir)) {
    throw new CliError(
      `dist directory not found at ${distDir}. Run lessonkit build before export with --no-build.`,
      {
        code: "INVALID_PROJECT",
        exitCode: EXIT_INVALID_PROJECT,
      },
    );
  }

  if (!opts.noBuild) {
    await runBuild({ cwd: project.root, json: opts.json });
  }

  if (!existsSync(distDir)) {
    throw new CliError(`dist directory not found at ${distDir}. Run lessonkit build first.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  resolveExportOutput(project.root, opts.out, project.name);
  const outRelative = opts.out ?? `${project.name}.lkcourse`;

  const result = await exportLkcourse({
    projectRoot: project.root,
    manifest: project,
    outPath: outRelative,
    includeBlockTree: Boolean(opts.withBlockTree),
  });

  if (!result.ok) {
    throw new CliError(
      result.issues.map((i) => `${i.path}: ${i.message}`).join("; "),
      { code: "EXPORT_FAILED", exitCode: EXIT_PACKAGING },
    );
  }

  return {
    ok: true,
    command: "export",
    projectRoot: project.root,
    archivePath: result.archivePath,
    fileCount: result.fileCount,
    includeBlockTree: result.includeBlockTree,
  };
}
