import { beforeAll, describe, expect, it } from "vitest";
import { assertScormZip, assertZipExists } from "./helpers/assertArtifacts.js";
import { INTERACTIVE_BOOK_DIR, requireCliOutputPath } from "./helpers/paths.js";
import { ensureInteractiveBookBuilt } from "./helpers/tempProject.js";
import { runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
};

describe("interactive-book package (1.2.0)", () => {
  beforeAll(async () => {
    await ensureInteractiveBookBuilt();
  });

  it("packages as SCORM 1.2 with InteractiveBook compound", () => {
    const { result, json } = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: INTERACTIVE_BOOK_DIR },
    );

    expect(result.exitCode).toBe(0);
    expect(json.ok).toBe(true);
    expect(json.target).toBe("scorm12");

    const zipPath = requireCliOutputPath(json);
    assertZipExists(zipPath);
    assertScormZip(zipPath);
  });
});
