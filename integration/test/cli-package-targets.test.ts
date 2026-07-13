import { beforeAll, describe, expect, it } from "vitest";
import {
  assertCmi5Zip,
  assertScormZip,
  assertStandaloneDir,
  assertXapiZip,
  assertZipExists,
} from "./helpers/assertArtifacts.js";
import { GOLDEN_DIR, requireCliOutputDir, requireCliOutputPath } from "./helpers/paths.js";
import { withProjectLock } from "./helpers/projectLock.js";
import { ensureGoldenBuilt } from "./helpers/tempProject.js";
import { runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
  outputDir?: string;
};

const LMS_TARGETS = ["standalone", "scorm12", "scorm2004", "xapi", "cmi5"] as const;

describe("CLI package targets (golden example)", () => {
  beforeAll(async () => {
    await ensureGoldenBuilt();
  });

  for (const target of LMS_TARGETS) {
    it(`packages golden course as ${target}`, async () => {
      await withProjectLock(GOLDEN_DIR, () => {
        const { result, json } = runCliJson<PackageJson>(
          ["package", "--target", target, "--no-build"],
          { cwd: GOLDEN_DIR },
        );

        expect(result.exitCode).toBe(0);
        expect(json.ok).toBe(true);
        expect(json.target).toBe(target);

        if (target === "standalone") {
          assertStandaloneDir(requireCliOutputDir(json));
          return;
        }

        const zipPath = requireCliOutputPath(json);
        assertZipExists(zipPath);
        if (target === "scorm12" || target === "scorm2004") {
          assertScormZip(zipPath);
        } else if (target === "xapi") {
          assertXapiZip(
            zipPath,
            "https://lessonkit.example/courses/workplace-safety-briefing",
          );
        } else if (target === "cmi5") {
          assertCmi5Zip(
            zipPath,
            "https://lessonkit.example/courses/workplace-safety-briefing",
          );
        }
      });
    });
  }
});
