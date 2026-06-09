import { beforeAll, describe, expect, it } from "vitest";
import { assertScormZip, assertZipExists } from "./helpers/assertArtifacts.js";
import { SLIDE_DECK_DIR, requireCliOutputPath } from "./helpers/paths.js";
import { ensureSlideDeckBuilt } from "./helpers/tempProject.js";
import { runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
};

describe("slide-deck package (1.3.0)", () => {
  beforeAll(async () => {
    await ensureSlideDeckBuilt();
  });

  it("packages as SCORM 1.2 with SlideDeck compound", () => {
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: SLIDE_DECK_DIR },
    );

    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
    expect(json.target).toBe("scorm12");

    const zipPath = requireCliOutputPath(json);
    assertZipExists(zipPath);
    assertScormZip(zipPath);
  });
});
