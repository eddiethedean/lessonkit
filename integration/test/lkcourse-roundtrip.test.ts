import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { importLkcourse, validateLkcourse } from "@lessonkit/lxpack";
import { assertLkcourseZip, assertViteDist } from "./helpers/assertArtifacts.js";
import { createTempDir } from "./helpers/tempProject.js";
import { REPO_ROOT } from "./helpers/paths.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

const goldenDir = join(REPO_ROOT, "examples", "lxpack-golden");

describe("lkcourse golden round-trip", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    ensurePackagesBuilt();
  });

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("exports, validates, and imports with lessonkit.json parity", async () => {
    const outFile = join(goldenDir, ".integration-golden.lkcourse");
    tempDirs.push(outFile);

    const build = runCliJson<{ ok: boolean }>(["build"], { cwd: goldenDir });
    expect(build.result.exitCode).toBe(0);
    assertViteDist(join(goldenDir, "dist"));

    const exported = runCliJson<{
      ok: boolean;
      archivePath?: string;
      fileCount?: number;
    }>(["export", "--no-build", "--out", ".integration-golden.lkcourse"], { cwd: goldenDir });
    expect(exported.result.exitCode).toBe(0);
    expect(exported.json.ok).toBe(true);
    expect(exported.json.archivePath).toContain(".integration-golden.lkcourse");
    assertLkcourseZip(outFile);

    const validated = validateLkcourse(outFile);
    expect(validated.ok).toBe(true);

    const importDir = await createTempDir("lk-golden-import-");
    tempDirs.push(importDir);

    const imported = await importLkcourse({
      archivePath: outFile,
      targetDir: importDir,
    });
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;

    const original = JSON.parse(await readFile(join(goldenDir, "lessonkit.json"), "utf8"));
    const restored = JSON.parse(await readFile(join(importDir, "lessonkit.json"), "utf8"));
    expect(restored).toEqual(original);
    assertViteDist(join(importDir, "dist"));
  });
});
