import { slugifyId } from "@lessonkit/core";
import { cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CliLogger } from "../lib/logger.js";
import { CliError, EXIT_INVALID_PROJECT, type CliJsonResult } from "../lib/errors.js";
import { runNpmInstall } from "../lib/exec.js";

const SKIP_DIRS = new Set(["node_modules", "dist", ".lxpack", ".git", "coverage", ".nyc_output"]);
const SKIP_FILES = new Set([".DS_Store"]);

export type InitOptions = {
  name?: string;
  here?: boolean;
  skipInstall?: boolean;
  force?: boolean;
  json?: boolean;
};

function getTemplateDir(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(thisDir, "../template/vite-react"),
    resolve(thisDir, "../../template/vite-react"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return candidates[0]!;
}

async function isDirEmpty(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return true;
  const entries = await readdir(dir);
  return entries.length === 0;
}

/** True when the directory has no entries other than dotfiles (e.g. `.git`). */
async function isDirEmptyOrDotfilesOnly(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return true;
  const entries = await readdir(dir);
  return entries.every((name) => name.startsWith("."));
}

function escapeJsxString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
    .replace(/\r\n|\n|\r/g, "\\n");
}

async function copyTemplate(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name) || SKIP_FILES.has(entry.name)) continue;

    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyTemplate(srcPath, destPath);
    } else if (entry.isFile()) {
      await cp(srcPath, destPath);
    } else {
      /* v8 ignore next -- template tree entries are files or directories */
    }
  }
}

async function applyTemplateSubstitutions(projectDir: string, projectName: string, slug: string): Promise<void> {
  const pkgPath = join(projectDir, "package.json");
  const lessonkitPath = join(projectDir, "lessonkit.json");

  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as Record<string, unknown>;
  pkg.name = slug;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

  const lessonkit = JSON.parse(await readFile(lessonkitPath, "utf8")) as Record<string, unknown>;
  lessonkit.name = slug;
  const course = lessonkit.course as Record<string, unknown>;
  course.courseId = slug;
  course.title = projectName;
  const courseTracking = (course.tracking ?? {}) as Record<string, unknown>;
  const courseXapi = (courseTracking.xapi ?? {}) as Record<string, unknown>;
  courseXapi.activityIri = `https://example.com/courses/${slug}`;
  courseTracking.xapi = courseXapi;
  course.tracking = courseTracking;
  await writeFile(lessonkitPath, `${JSON.stringify(lessonkit, null, 2)}\n`, "utf8");

  const courseConfigPath = join(projectDir, "src", "courseConfig.ts");
  let courseConfigSource = await readFile(courseConfigPath, "utf8");
  courseConfigSource = courseConfigSource.replace(/courseId: "my-course"/g, `courseId: "${slug}"`);
  await writeFile(courseConfigPath, courseConfigSource, "utf8");

  const appPath = join(projectDir, "src", "App.tsx");
  let appSource = await readFile(appPath, "utf8");
  appSource = appSource.replace(/courseId="my-course"/g, `courseId="${slug}"`);
  appSource = appSource.replace(/\{\{courseTitle\}\}/g, escapeJsxString(projectName));
  await writeFile(appPath, appSource, "utf8");
}

async function backupConflictingFiles(
  stagingDir: string,
  projectDir: string,
): Promise<Map<string, Buffer>> {
  const backups = new Map<string, Buffer>();
  const stagingEntries = await readdir(stagingDir, { withFileTypes: true });
  for (const entry of stagingEntries) {
    const destPath = join(projectDir, entry.name);
    if (!existsSync(destPath)) continue;
    const destStat = await stat(destPath);
    if (destStat.isFile()) {
      backups.set(entry.name, await readFile(destPath));
    }
  }
  return backups;
}

async function rollbackPromotedFiles(
  projectDir: string,
  stagingDir: string,
  preExisting: Set<string>,
  backups: Map<string, Buffer>,
): Promise<void> {
  const failures: string[] = [];
  let stagingEntries;
  try {
    stagingEntries = await readdir(stagingDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of stagingEntries) {
    if (preExisting.has(entry.name)) continue;
    try {
      await rm(join(projectDir, entry.name), { recursive: true, force: true });
    } catch (err) {
      failures.push(
        `remove ${entry.name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  for (const [name, content] of backups) {
    try {
      await writeFile(join(projectDir, name), content);
    } catch (err) {
      failures.push(`restore ${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (failures.length > 0) {
    throw new CliError(`Init rollback failed: ${failures.join("; ")}`, {
      code: "RUNTIME",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }
}

async function promoteStagingToProjectDir(stagingDir: string, projectDir: string): Promise<void> {
  await mkdir(projectDir, { recursive: true });
  const entries = await readdir(stagingDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(stagingDir, entry.name);
    const destPath = join(projectDir, entry.name);
    if (entry.isDirectory()) {
      await cp(srcPath, destPath, { recursive: true });
    } else if (entry.isFile()) {
      await cp(srcPath, destPath);
    } else {
      /* v8 ignore next -- template tree entries are files or directories */
    }
  }
}

/** @internal Exported for coverage of edge-case helpers only. */
export const __testInitHelpers = {
  getTemplateDir,
  isDirEmpty,
  isDirEmptyOrDotfilesOnly,
  escapeJsxString,
  copyTemplate,
  promoteStagingToProjectDir,
  rollbackPromotedFiles,
  backupConflictingFiles,
};

export async function runInit(opts: InitOptions, logger: CliLogger): Promise<CliJsonResult> {
  const cwd = process.cwd();
  const rawName =
    opts.name ??
    (opts.here ? slugifyId(basename(process.cwd()) || "my-course") : undefined);

  if (!rawName && !opts.here) {
    throw new CliError("Project name is required. Usage: lessonkit init <name> or lessonkit init --here", {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  if (opts.force && !opts.here) {
    throw new CliError("--force requires --here (initialize in the current directory).", {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const slug = slugifyId(rawName!);
  const projectName = rawName!;
  const projectDir = opts.here ? cwd : resolve(cwd, slug);

  if (!opts.here && existsSync(projectDir)) {
    throw new CliError(
      `Directory already exists: ${projectDir}. Choose a different name or remove the directory.`,
      {
        code: "INVALID_PROJECT",
        exitCode: EXIT_INVALID_PROJECT,
      },
    );
  }

  if (opts.here && !(await isDirEmptyOrDotfilesOnly(projectDir)) && !opts.force) {
    throw new CliError(
      `Directory is not empty: ${projectDir}. Use --here --force only when the directory is empty or contains dotfiles only (e.g. .git).`,
      {
        code: "INVALID_PROJECT",
        exitCode: EXIT_INVALID_PROJECT,
      },
    );
  }

  if (opts.here && opts.force && !(await isDirEmptyOrDotfilesOnly(projectDir))) {
    throw new CliError(
      `Directory is not empty: ${projectDir}. --force only initializes when the directory is empty or contains dotfiles only (e.g. .git).`,
      {
        code: "INVALID_PROJECT",
        exitCode: EXIT_INVALID_PROJECT,
      },
    );
  }

  const templateDir = getTemplateDir();
  if (!existsSync(templateDir)) {
    throw new CliError(`Bundled template not found at ${templateDir}. Reinstall @lessonkit/cli.`, {
      code: "RUNTIME",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const stagingDir = opts.here
    ? join(cwd, `.lessonkit-init-${randomUUID()}`)
    : join(cwd, `.${slug}-init-${randomUUID()}`);

  try {
    await copyTemplate(templateDir, stagingDir);
    await applyTemplateSubstitutions(stagingDir, projectName, slug);

    if (!opts.skipInstall) {
      if (!opts.json) logger.log(`Installing dependencies in ${stagingDir}…`);
      await runNpmInstall(stagingDir);
    }

    if (opts.here) {
      const preExisting = new Set(await readdir(projectDir));
      const backups = await backupConflictingFiles(stagingDir, projectDir);
      try {
        await __testInitHelpers.promoteStagingToProjectDir(stagingDir, projectDir);
      } catch (promoteErr) {
        try {
          await rollbackPromotedFiles(projectDir, stagingDir, preExisting, backups);
        } catch (rollbackErr) {
          const promoteMessage =
            promoteErr instanceof Error ? promoteErr.message : String(promoteErr);
          const rollbackMessage =
            rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
          throw new CliError(`${promoteMessage}; ${rollbackMessage}`, {
            code: "RUNTIME",
            exitCode: EXIT_INVALID_PROJECT,
          });
        }
        throw promoteErr;
      }
      await rm(stagingDir, { recursive: true, force: true });
    } else {
      await rename(stagingDir, projectDir);
    }
  } catch (err) {
    await rm(stagingDir, { recursive: true, force: true }).catch(/* v8 ignore next */ () => undefined);
    throw err;
  }

  if (!opts.json) {
    logger.log(`Created LessonKit project at ${projectDir}`);
    logger.log(`Next: cd ${opts.here ? "." : slug} && lessonkit dev`);
  }

  return { ok: true, command: "init", projectRoot: projectDir };
}
