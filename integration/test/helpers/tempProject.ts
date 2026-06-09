import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LESSONKIT_PACKAGES,
  MINIMAL_FIXTURE_DIR,
  REPO_ROOT,
  SHARED_MINIMAL_FIXTURE_DIR,
  packageDir,
} from "./paths.js";
import { runNpm } from "./runCli.js";

const exampleBuilds = new Map<string, Promise<void>>();

export async function createTempDir(prefix = "lk-integration-"): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function patchPackageJsonForMonorepo(pkgPath: string): Promise<void> {
  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  for (const name of LESSONKIT_PACKAGES) {
    const fileUrl = `file:${packageDir(name)}`;
    if (pkg.dependencies?.[name]) {
      pkg.dependencies[name] = fileUrl;
    }
    if (pkg.devDependencies?.[name]) {
      pkg.devDependencies[name] = fileUrl;
    }
  }

  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

export async function installProjectDeps(projectDir: string): Promise<void> {
  const npmCache = join(projectDir, ".npm-cache");
  const install = runNpm(
    ["install", "--no-audit", "--no-fund", "--legacy-peer-deps", "--cache", npmCache],
    {
      cwd: projectDir,
      timeoutMs: 300_000,
      env: {
        npm_config_cache: npmCache,
      },
    },
  );
  if (install.exitCode !== 0) {
    throw new Error(
      `npm install failed in ${projectDir}:\n${install.stdout}\n${install.stderr}`,
    );
  }
}

async function copyNodeModulesFromShared(projectDir: string): Promise<boolean> {
  const sharedModules = join(SHARED_MINIMAL_FIXTURE_DIR, "node_modules");
  if (!existsSync(sharedModules)) return false;
  await cp(sharedModules, join(projectDir, "node_modules"), { recursive: true });
  return true;
}

export async function installProjectDepsIfNeeded(projectDir: string): Promise<void> {
  if (existsSync(join(projectDir, "node_modules"))) return;
  if (await copyNodeModulesFromShared(projectDir)) return;
  await installProjectDeps(projectDir);
}

/** Copy minimal-course fixture (preinstalled cache when available). */
export async function copyMinimalFixture(destDir: string): Promise<void> {
  const source = existsSync(SHARED_MINIMAL_FIXTURE_DIR)
    ? SHARED_MINIMAL_FIXTURE_DIR
    : MINIMAL_FIXTURE_DIR;
  await cp(source, destDir, {
    recursive: true,
    filter: (src) => !src.includes(".npm-cache"),
  });
  if (source === MINIMAL_FIXTURE_DIR) {
    await patchPackageJsonForMonorepo(join(destDir, "package.json"));
    await installProjectDepsIfNeeded(destDir);
  }
}

export async function prepareMinimalProject(): Promise<string> {
  const dir = await createTempDir();
  await copyMinimalFixture(dir);
  return dir;
}

/** Copy shared minimal fixture, install deps once, and run lessonkit build. */
export async function prepareBuiltMinimalProject(): Promise<string> {
  const dir = await prepareMinimalProject();
  const { runCliJson } = await import("./runCli.js");
  const build = runCliJson<{ ok: boolean }>(["build"], { cwd: dir });
  if (build.result.exitCode !== 0 || !build.json.ok) {
    throw new Error(`lessonkit build failed in ${dir}:\n${build.result.stdout}\n${build.result.stderr}`);
  }
  return dir;
}

export async function cloneProjectTree(sourceDir: string, prefix = "lk-integration-"): Promise<string> {
  const dir = await createTempDir(prefix);
  await cp(sourceDir, dir, { recursive: true });
  return dir;
}

export async function prepareInitProject(parentDir: string, name: string): Promise<string> {
  const { runCli } = await import("./runCli.js");
  const init = runCli(["init", name, "--skip-install", "--json"], { cwd: parentDir });
  if (init.exitCode !== 0) {
    throw new Error(`lessonkit init failed:\n${init.stdout}\n${init.stderr}`);
  }
  const projectDir = join(parentDir, name);
  await patchPackageJsonForMonorepo(join(projectDir, "package.json"));
  await installProjectDepsIfNeeded(projectDir);
  return projectDir;
}

function ensureExampleBuilt(workspace: string, distIndex: string): Promise<void> {
  const existing = exampleBuilds.get(workspace);
  if (existing) return existing;

  const build = (async () => {
    if (existsSync(distIndex)) return;
    const { execSync } = await import("node:child_process");
    execSync(`npm run build -w ${workspace}`, { cwd: REPO_ROOT, stdio: "inherit" });
  })();
  exampleBuilds.set(workspace, build);
  return build;
}

export function ensureGoldenBuilt(): Promise<void> {
  return ensureExampleBuilt(
    "lessonkit-example-lxpack-golden",
    join(REPO_ROOT, "examples/lxpack-golden/dist/index.html"),
  );
}

export function ensureAssessmentsP0Built(): Promise<void> {
  return ensureExampleBuilt(
    "lessonkit-example-assessments-p0",
    join(REPO_ROOT, "examples/assessments-p0/dist/index.html"),
  );
}

export function ensureInteractiveBookBuilt(): Promise<void> {
  return ensureExampleBuilt(
    "lessonkit-example-interactive-book",
    join(REPO_ROOT, "examples/interactive-book/dist/index.html"),
  );
}

export function ensureSlideDeckBuilt(): Promise<void> {
  return ensureExampleBuilt(
    "lessonkit-example-slide-deck",
    join(REPO_ROOT, "examples/slide-deck/dist/index.html"),
  );
}

export function ensureInteractiveVideoBuilt(): Promise<void> {
  return ensureExampleBuilt(
    "lessonkit-example-interactive-video",
    join(REPO_ROOT, "examples/interactive-video/dist/index.html"),
  );
}

export function ensureBranchingScenarioBuilt(): Promise<void> {
  return ensureExampleBuilt(
    "lessonkit-example-branching-scenario",
    join(REPO_ROOT, "examples/branching-scenario/dist/index.html"),
  );
}

export function ensureFramework12ShowcaseBuilt(): Promise<void> {
  return ensureExampleBuilt(
    "lessonkit-example-framework-12-showcase",
    join(REPO_ROOT, "examples/framework-12-showcase/dist/index.html"),
  );
}
