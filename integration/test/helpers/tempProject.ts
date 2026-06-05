import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LESSONKIT_PACKAGES,
  MINIMAL_FIXTURE_DIR,
  REPO_ROOT,
  packageDir,
} from "./paths.js";
import { runNpm } from "./runCli.js";

export async function createTempDir(prefix = "lk-integration-"): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

/** Copy minimal-course fixture and link @lessonkit/* to monorepo packages. */
export async function copyMinimalFixture(destDir: string): Promise<void> {
  await cp(MINIMAL_FIXTURE_DIR, destDir, { recursive: true });
  await patchPackageJsonForMonorepo(join(destDir, "package.json"));
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

export async function prepareMinimalProject(): Promise<string> {
  const dir = await createTempDir();
  await copyMinimalFixture(dir);
  await installProjectDeps(dir);
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
  await installProjectDeps(projectDir);
  return projectDir;
}

export async function ensureGoldenBuilt(): Promise<void> {
  const { existsSync } = await import("node:fs");
  const distIndex = join(REPO_ROOT, "examples/lxpack-golden/dist/index.html");
  if (existsSync(distIndex)) return;

  const { execSync } = await import("node:child_process");
  execSync("npm run build -w lessonkit-example-lxpack-golden", {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
}

export async function ensureAssessmentsP0Built(): Promise<void> {
  const { existsSync } = await import("node:fs");
  const distIndex = join(REPO_ROOT, "examples/assessments-p0/dist/index.html");
  if (existsSync(distIndex)) return;

  const { execSync } = await import("node:child_process");
  execSync("npm run build -w lessonkit-example-assessments-p0", {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
}

export async function ensureInteractiveBookBuilt(): Promise<void> {
  const { existsSync } = await import("node:fs");
  const distIndex = join(REPO_ROOT, "examples/interactive-book/dist/index.html");
  if (existsSync(distIndex)) return;

  const { execSync } = await import("node:child_process");
  execSync("npm run build -w lessonkit-example-interactive-book", {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
}
