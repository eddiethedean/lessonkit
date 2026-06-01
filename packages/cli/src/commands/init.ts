import { slugifyId } from "@lessonkit/core";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CliLogger } from "../lib/logger.js";
import { CliError, EXIT_INVALID_PROJECT, type CliJsonResult } from "../lib/errors.js";
import { runNpmInstall } from "../lib/exec.js";

const SKIP_DIRS = new Set(["node_modules", "dist", ".lxpack", ".git"]);
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
  pkg.name = projectName;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

  const lessonkit = JSON.parse(await readFile(lessonkitPath, "utf8")) as Record<string, unknown>;
  lessonkit.name = slug;
  const course = lessonkit.course as Record<string, unknown>;
  course.courseId = slug;
  course.title = projectName;
  await writeFile(lessonkitPath, `${JSON.stringify(lessonkit, null, 2)}\n`, "utf8");

  const appPath = join(projectDir, "src", "App.tsx");
  let appSource = await readFile(appPath, "utf8");
  appSource = appSource.replace(/courseId="my-course"/g, `courseId="${slug}"`);
  appSource = appSource.replace(/\{\{courseTitle\}\}/g, escapeJsxString(projectName));
  await writeFile(appPath, appSource, "utf8");
}

/** @internal Exported for coverage of edge-case helpers only. */
export const __testInitHelpers = {
  getTemplateDir,
  isDirEmpty,
  isDirEmptyOrDotfilesOnly,
  escapeJsxString,
  copyTemplate,
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

  if (opts.here && !(await isDirEmpty(projectDir)) && !opts.force) {
    throw new CliError(`Directory is not empty: ${projectDir}. Use --force to initialize anyway.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
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

  await copyTemplate(templateDir, projectDir);
  await applyTemplateSubstitutions(projectDir, projectName, slug);

  if (!opts.skipInstall) {
    if (!opts.json) logger.log(`Installing dependencies in ${projectDir}…`);
    await runNpmInstall(projectDir);
  }

  if (!opts.json) {
    logger.log(`Created LessonKit project at ${projectDir}`);
    logger.log(`Next: cd ${opts.here ? "." : slug} && lessonkit dev`);
  }

  return { ok: true, command: "init", projectRoot: projectDir };
}
