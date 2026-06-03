import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { assertScormZip, assertZipExists } from "./helpers/assertArtifacts.js";
import { ASSESSMENTS_P0_DIR } from "./helpers/paths.js";
import { ensureAssessmentsP0Built } from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
};

describe("assessments-p0 package (1.1.0)", () => {
  beforeAll(async () => {
    ensurePackagesBuilt();
    await ensureAssessmentsP0Built();
  });

  it("packages as SCORM 1.2 with trueFalse assessment", () => {
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: ASSESSMENTS_P0_DIR },
    );

    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
    expect(json.target).toBe("scorm12");

    const zipPath =
      json.outputPath ??
      join(ASSESSMENTS_P0_DIR, ".lxpack/course/.lxpack/out/course-scorm12.zip");
    assertZipExists(zipPath);
    assertScormZip(zipPath);
  });
});
