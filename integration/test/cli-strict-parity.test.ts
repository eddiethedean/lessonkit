import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { assertScormZip, assertStandaloneDir } from "./helpers/assertArtifacts.js";
import {
  BRANCHING_SCENARIO_DIR,
  GOLDEN_DIR,
  requireCliOutputDir,
  requireCliOutputPath,
} from "./helpers/paths.js";
import {
  copyMinimalFixture,
  createTempDir,
  ensureBranchingScenarioBuilt,
  ensureGoldenBuilt,
  installProjectDeps,
} from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  outputPath?: string;
  outputDir?: string;
  issues?: Array<{ path?: string; message: string; severity?: string }>;
};

describe("CLI --strict-parity", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    ensurePackagesBuilt();
  });

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("succeeds on lxpack-golden when React IDs match the manifest", async () => {
    await ensureGoldenBuilt();
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build", "--strict-parity"],
      { cwd: GOLDEN_DIR },
    );
    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
  });

  it("fails when React courseId drifts from lessonkit.json with --strict-parity", async () => {
    const projectDir = await createTempDir();
    tempDirs.push(projectDir);
    await copyMinimalFixture(projectDir);
    await installProjectDeps(projectDir);

    const build = runCliJson<{ ok: boolean }>(["build"], { cwd: projectDir });
    expect(build.result.exitCode).toBe(0);

    const appPath = join(projectDir, "src/App.tsx");
    const appSource = await readFile(appPath, "utf8");
    await writeFile(appPath, appSource.replace('courseId="minimal-course"', 'courseId="wrong-course"'));

    const pkg = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build", "--strict-parity"],
      { cwd: projectDir },
    );
    expect(pkg.result.exitCode).not.toBe(0);
    expect(pkg.json.ok).toBe(false);
  });
});

describe("branching-scenario packaging targets", () => {
  beforeAll(async () => {
    ensurePackagesBuilt();
    await ensureBranchingScenarioBuilt();
  });

  it("packages as standalone", () => {
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "standalone", "--no-build"],
      { cwd: BRANCHING_SCENARIO_DIR },
    );
    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
    assertStandaloneDir(requireCliOutputDir(json));
  });

  it("packages as SCORM 2004", () => {
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm2004", "--no-build"],
      { cwd: BRANCHING_SCENARIO_DIR },
    );
    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
    assertScormZip(requireCliOutputPath(json));
  });
});
