import { beforeAll, describe, expect, it } from "vitest";
import { assertScormZip, assertZipExists } from "./helpers/assertArtifacts.js";
import { FRAMEWORK_12_SHOWCASE_DIR, requireCliOutputPath } from "./helpers/paths.js";
import { ensureFramework12ShowcaseBuilt } from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
};

describe("framework-12-showcase package (1.6.x)", () => {
  beforeAll(async () => {
    ensurePackagesBuilt();
    await ensureFramework12ShowcaseBuilt();
  });

  it("packages as SCORM 1.2 with 1.6.x content-wave blocks", () => {
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: FRAMEWORK_12_SHOWCASE_DIR },
    );

    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
    expect(json.target).toBe("scorm12");

    const zipPath = requireCliOutputPath(json);
    assertZipExists(zipPath);
    assertScormZip(zipPath);
  });
});
