import { readFileSync, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, parse, resolve } from "node:path";
import { parseLessonkitManifest } from "@lessonkit/lxpack";
import type { LessonkitCourseDescriptor } from "@lessonkit/lxpack";
import { CliError, EXIT_INVALID_PROJECT } from "./errors.js";

export const LESSONKIT_JSON = "lessonkit.json";
export const PACKAGE_JSON = "package.json";

export type LessonkitPaths = {
  spaDistDir: string;
  lxpackOutDir: string;
  outputBaseDir: string;
};

export type LessonkitProject = {
  root: string;
  schemaVersion: number;
  name: string;
  course: LessonkitCourseDescriptor;
  paths: LessonkitPaths;
};

export type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function isProjectManifest(configPath: string): boolean {
  try {
    const raw = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
    return (
      raw.schemaVersion === 1 &&
      typeof raw.name === "string" &&
      raw.course !== null &&
      typeof raw.course === "object" &&
      !Array.isArray(raw.course)
    );
  } catch {
    return false;
  }
}

export function findProjectRoot(startDir: string = process.cwd()): string {
  let dir = resolve(startDir);
  const fsRoot = parse(dir).root;

  while (true) {
    const configPath = join(dir, LESSONKIT_JSON);
    if (existsSync(configPath) && isProjectManifest(configPath)) {
      return dir;
    }
    if (dir === fsRoot) {
      throw new CliError(`Could not find ${LESSONKIT_JSON} in ${startDir} or any parent directory.`, {
        code: "INVALID_PROJECT",
        exitCode: EXIT_INVALID_PROJECT,
      });
    }
    dir = dirname(dir);
  }
}

export async function loadLessonkitJson(projectRoot: string): Promise<LessonkitProject> {
  const configPath = join(projectRoot, LESSONKIT_JSON);
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(configPath, "utf8"));
  } catch {
    throw new CliError(`Failed to read or parse ${configPath}.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const parsed = parseLessonkitManifest(raw, configPath, projectRoot);
  if (!parsed.ok) {
    throwManifestCliError(configPath, parsed.issues);
  }

  return {
    root: projectRoot,
    schemaVersion: 1,
    name: parsed.manifest.name,
    course: parsed.manifest.course,
    paths: parsed.manifest.paths,
  };
}

function throwManifestCliError(
  configPath: string,
  issues: Array<{ path: string; message: string }>,
): never {
  const layoutIssue = issues.find((i) => i.path === "course.layout");
  if (layoutIssue?.message.includes("per-lesson-spa")) {
    throw new CliError(
      `${configPath}: per-lesson-spa layout is not supported by lessonkit package yet. Use single-spa or package via @lessonkit/lxpack directly.`,
      { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT },
    );
  }

  const lessonsIssue = issues.find((i) => i.path === "course.lessons");
  if (lessonsIssue) {
    throw new CliError(`${configPath}: "course.lessons" must be an array.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const spaDistTypeIssue = issues.find((i) => i.path === "paths.spaDistDir");
  if (spaDistTypeIssue && spaDistTypeIssue.message.includes("non-empty string")) {
    throw new CliError(`${configPath}: "paths.spaDistDir" must be a non-empty string.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const courseSpaIssue = issues.find((i) => i.path === "course.spaDistDir");
  if (courseSpaIssue) {
    throw new CliError(`${configPath}: ${courseSpaIssue.message}`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  if (issues.some((i) => i.path.startsWith("paths."))) {
    throw new CliError(`${configPath}: invalid paths.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
      issues: issues.map((i) => ({ path: i.path, message: i.message })),
    });
  }

  const schemaIssue = issues.find((i) => i.path === "schemaVersion");
  if (schemaIssue) {
    throw new CliError(`${configPath}: schemaVersion must be 1 (got ${schemaIssue.message.replace(/^must be 1 \(got /, "").replace(/\)$/, "")}).`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  throw new CliError(`${configPath}: invalid lessonkit manifest.`, {
    code: "INVALID_PROJECT",
    exitCode: EXIT_INVALID_PROJECT,
    issues: issues.map((i) => ({ path: i.path, message: i.message })),
  });
}

export async function loadProject(cwd: string = process.cwd()): Promise<LessonkitProject> {
  const root = findProjectRoot(cwd);
  return loadLessonkitJson(root);
}

export async function readPackageJson(projectRoot: string): Promise<PackageJson> {
  const pkgPath = join(projectRoot, PACKAGE_JSON);
  try {
    return JSON.parse(await readFile(pkgPath, "utf8")) as PackageJson;
  } catch {
    throw new CliError(`Failed to read or parse ${pkgPath}.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }
}

export function assertViteProject(pkg: PackageJson, projectRoot: string): void {
  const vite =
    pkg.devDependencies?.vite ??
    pkg.dependencies?.vite ??
    (existsSync(join(projectRoot, "node_modules", ".bin", "vite")) ||
    existsSync(join(projectRoot, "node_modules", ".bin", "vite.cmd"))
      ? "present"
      : undefined);

  if (!vite) {
    throw new CliError(
      `No Vite dependency found in ${join(projectRoot, PACKAGE_JSON)}. LessonKit projects require Vite.`,
      { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT },
    );
  }
}

export function resolveViteBin(projectRoot: string): string {
  let dir = resolve(projectRoot);
  const fsRoot = parse(dir).root;

  while (true) {
    const binDir = join(dir, "node_modules", ".bin");
    const bin = join(binDir, "vite");
    if (existsSync(bin)) return bin;
    const binCmd = join(binDir, "vite.cmd");
    if (existsSync(binCmd)) return binCmd;
    if (dir === fsRoot) break;
    dir = dirname(dir);
  }

  throw new CliError(
    `Vite binary not found near ${projectRoot}. Run npm install in the project first.`,
    { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT },
  );
}

export function assertNode18ForLxpack(): void {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 18) {
    throw new CliError(
      `LMS packaging requires Node.js 18+ (current: ${process.versions.node}). See docs/PACKAGING.md.`,
      { code: "NODE_VERSION", exitCode: EXIT_INVALID_PROJECT },
    );
  }
}
