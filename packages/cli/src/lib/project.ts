import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { LessonkitCourseDescriptor } from "@lessonkit/lxpack";
import { validateDescriptor } from "@lessonkit/lxpack";
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

const DEFAULT_PATHS: LessonkitPaths = {
  spaDistDir: "dist",
  lxpackOutDir: ".lxpack/course",
  outputBaseDir: ".lxpack/out",
};

export function findProjectRoot(startDir: string = process.cwd()): string {
  let dir = resolve(startDir);
  const root = resolve("/");

  while (true) {
    if (existsSync(join(dir, LESSONKIT_JSON))) {
      return dir;
    }
    if (dir === root) {
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

  if (!raw || typeof raw !== "object") {
    throw new CliError(`${configPath} must be a JSON object.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const config = raw as Record<string, unknown>;
  const schemaVersion = config.schemaVersion;
  if (schemaVersion !== 1) {
    throw new CliError(`${configPath}: schemaVersion must be 1 (got ${String(schemaVersion)}).`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const name = config.name;
  if (typeof name !== "string" || !name.trim()) {
    throw new CliError(`${configPath}: "name" must be a non-empty string.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const courseRaw = config.course;
  if (!courseRaw || typeof courseRaw !== "object") {
    throw new CliError(`${configPath}: "course" must be an object.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
    });
  }

  const validation = validateDescriptor(courseRaw as LessonkitCourseDescriptor);
  if (!validation.ok) {
    throw new CliError(`${configPath}: invalid course descriptor.`, {
      code: "INVALID_PROJECT",
      exitCode: EXIT_INVALID_PROJECT,
      issues: validation.issues.map((i) => ({
        path: i.path,
        message: i.message,
      })),
    });
  }

  const pathsRaw = config.paths;
  const paths: LessonkitPaths = { ...DEFAULT_PATHS };
  if (pathsRaw && typeof pathsRaw === "object") {
    const p = pathsRaw as Record<string, unknown>;
    if (typeof p.spaDistDir === "string" && p.spaDistDir.trim()) paths.spaDistDir = p.spaDistDir;
    if (typeof p.lxpackOutDir === "string" && p.lxpackOutDir.trim()) paths.lxpackOutDir = p.lxpackOutDir;
    if (typeof p.outputBaseDir === "string" && p.outputBaseDir.trim()) paths.outputBaseDir = p.outputBaseDir;
  }

  return {
    root: projectRoot,
    schemaVersion: 1,
    name,
    course: validation.descriptor,
    paths,
  };
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
    (existsSync(join(projectRoot, "node_modules", ".bin", "vite")) ? "present" : undefined);

  if (!vite) {
    throw new CliError(
      `No Vite dependency found in ${join(projectRoot, PACKAGE_JSON)}. LessonKit projects require Vite.`,
      { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT },
    );
  }
}

export function resolveViteBin(projectRoot: string): string {
  let dir = resolve(projectRoot);
  const root = resolve("/");

  while (true) {
    const bin = join(dir, "node_modules", ".bin", "vite");
    if (existsSync(bin)) {
      return bin;
    }
    if (dir === root) break;
    dir = dirname(dir);
  }

  throw new CliError(
    `Vite binary not found near ${projectRoot}. Run npm install in the project first.`,
    { code: "INVALID_PROJECT", exitCode: EXIT_INVALID_PROJECT },
  );
}

export function assertNode20ForLxpack(): void {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 20) {
    throw new CliError(
      `LMS packaging requires Node.js 20+ (current: ${process.versions.node}). See docs/PACKAGING.md.`,
      { code: "NODE_VERSION", exitCode: EXIT_INVALID_PROJECT },
    );
  }
}
