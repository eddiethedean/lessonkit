import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  assertScormZip,
  assertStandaloneDir,
  assertZipExists,
} from "./helpers/assertArtifacts.js";
import { GOLDEN_DIR } from "./helpers/paths.js";
import { ensureGoldenBuilt } from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
  outputDir?: string;
};

const LMS_TARGETS = ["standalone", "scorm12", "scorm2004", "xapi", "cmi5"] as const;

describe("CLI package targets (golden example)", () => {
  beforeAll(async () => {
    ensurePackagesBuilt();
    await ensureGoldenBuilt();
  });

  for (const target of LMS_TARGETS) {
    it(`packages golden course as ${target}`, () => {
      const { result, json } = runCliJson<PackageJson>(
        ["package", "--target", target, "--no-build"],
        { cwd: GOLDEN_DIR },
      );

      expect(result.exitCode).toBe(0);
      expect(json.ok).toBe(true);
      expect(json.target).toBe(target);

      if (target === "standalone") {
        const dir =
          json.outputDir ?? join(GOLDEN_DIR, ".lxpack/course/.lxpack/out/standalone");
        assertStandaloneDir(dir);
        return;
      }

      const zipPath =
        json.outputPath ??
        join(GOLDEN_DIR, `.lxpack/course/.lxpack/out/course-${target}.zip`);
      assertZipExists(zipPath);
      if (target === "scorm12" || target === "scorm2004") {
        assertScormZip(zipPath);
      }
    });
  }
});
