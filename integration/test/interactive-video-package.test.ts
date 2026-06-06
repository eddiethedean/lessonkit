import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { assertScormZip, assertZipExists } from "./helpers/assertArtifacts.js";
import { INTERACTIVE_VIDEO_DIR } from "./helpers/paths.js";
import { ensureInteractiveVideoBuilt } from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
};

describe("interactive-video package (1.4.0)", () => {
  beforeAll(async () => {
    ensurePackagesBuilt();
    await ensureInteractiveVideoBuilt();
  });

  it("packages as SCORM 1.2 with InteractiveVideo compound", () => {
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: INTERACTIVE_VIDEO_DIR },
    );

    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
    expect(json.target).toBe("scorm12");

    const zipPath =
      json.outputPath ??
      join(INTERACTIVE_VIDEO_DIR, ".lxpack/course/.lxpack/out/course-scorm12.zip");
    assertZipExists(zipPath);
    assertScormZip(zipPath);
  });
});
