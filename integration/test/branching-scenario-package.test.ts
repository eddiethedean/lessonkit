import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { assertScormZip, assertZipExists } from "./helpers/assertArtifacts.js";
import { BRANCHING_SCENARIO_DIR } from "./helpers/paths.js";
import { ensureBranchingScenarioBuilt } from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
};

describe("branching-scenario package (1.5.0)", () => {
  beforeAll(async () => {
    ensurePackagesBuilt();
    await ensureBranchingScenarioBuilt();
  });

  it("packages as SCORM 1.2 with BranchingScenario compound", () => {
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: BRANCHING_SCENARIO_DIR },
    );

    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
    expect(json.target).toBe("scorm12");

    const zipPath =
      json.outputPath ??
      join(BRANCHING_SCENARIO_DIR, ".lxpack/course/.lxpack/out/course-scorm12.zip");
    assertZipExists(zipPath);
    assertScormZip(zipPath);
  });
});
