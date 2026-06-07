import { existsSync } from "node:fs";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { assertScormZip } from "./helpers/assertArtifacts.js";
import {
  copyMinimalFixture,
  createTempDir,
  installProjectDeps,
} from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  outputPath?: string;
};

describe("CLI --out integration", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    ensurePackagesBuilt();
  });

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("writes the packaged artifact to a custom path under the project root", async () => {
    const projectDir = await createTempDir();
    tempDirs.push(projectDir);
    await copyMinimalFixture(projectDir);
    await installProjectDeps(projectDir);

    const build = runCliJson<{ ok: boolean }>(["build"], { cwd: projectDir });
    expect(build.result.exitCode).toBe(0);
    expect(build.json.ok).toBe(true);

    const outRel = ".lxpack/out/custom-scorm12.zip";
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build", "--out", outRel],
      { cwd: projectDir },
    );

    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
    const zipPath = json.outputPath ?? join(projectDir, ".lxpack/course", outRel);
    expect(existsSync(zipPath)).toBe(true);
    assertScormZip(zipPath);
  });
});
