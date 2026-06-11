import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { assertScormZip } from "./helpers/assertArtifacts.js";
import { requireCliOutputPath } from "./helpers/paths.js";
import { copyMinimalFixture, createTempDir } from "./helpers/tempProject.js";
import { runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  outputPath?: string;
};

describe("CLI --out integration", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("writes the packaged artifact to a custom path under the project root", async () => {
    const projectDir = await createTempDir();
    tempDirs.push(projectDir);
    await copyMinimalFixture(projectDir);

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
    const zipPath = requireCliOutputPath(json);
    expect(existsSync(zipPath)).toBe(true);
    assertScormZip(zipPath);
  });
});
