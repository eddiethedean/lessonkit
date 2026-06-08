import { join } from "node:path";
import { rm } from "node:fs/promises";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  assertScormZip,
  assertStandaloneDir,
  assertViteDist,
} from "./helpers/assertArtifacts.js";
import { requireCliOutputDir, requireCliOutputPath } from "./helpers/paths.js";
import { createTempDir, prepareInitProject, prepareMinimalProject } from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
  outputDir?: string;
};

describe("CLI init → build → package", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    ensurePackagesBuilt();
  });

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  async function runPipeline(projectDir: string): Promise<void> {
    const build = runCliJson<{ ok: boolean }>(["build"], { cwd: projectDir });
    expect(build.result.exitCode).toBe(0);
    expect(build.json.ok).toBe(true);
    assertViteDist(join(projectDir, "dist"));

    const scorm = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: projectDir },
    );
    expect(scorm.result.exitCode).toBe(0);
    expect(scorm.json.ok).toBe(true);
    const scormZip = requireCliOutputPath(scorm.json);
    assertScormZip(scormZip);

    const standalone = runCliJson<PackageJson>(
      ["package", "--target", "standalone", "--no-build"],
      { cwd: projectDir },
    );
    expect(standalone.result.exitCode).toBe(0);
    expect(standalone.json.ok).toBe(true);
    const standaloneDir = requireCliOutputDir(standalone.json);
    assertStandaloneDir(standaloneDir);

    assertScormZip(scormZip);
  }

  it("builds and packages a minimal fixture project", async () => {
    const projectDir = await prepareMinimalProject();
    tempDirs.push(projectDir);
    await runPipeline(projectDir);
  });

  it("scaffolds via init --skip-install then builds and packages", async () => {
    const parent = await createTempDir("lk-init-");
    tempDirs.push(parent);
    const projectDir = await prepareInitProject(parent, "integration-init");
    await runPipeline(projectDir);
  });
});
