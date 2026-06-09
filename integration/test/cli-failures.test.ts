import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTempDir, copyMinimalFixture } from "./helpers/tempProject.js";
import { runCli } from "./helpers/runCli.js";

describe("CLI failure paths", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("package --no-build fails when dist is missing", async () => {
    const projectDir = await createTempDir();
    tempDirs.push(projectDir);
    await copyMinimalFixture(projectDir);
    await rm(join(projectDir, "dist"), { recursive: true, force: true });
    const result = runCli(
      ["package", "--target", "scorm12", "--no-build", "--json"],
      { cwd: projectDir },
    );
    expect(result.exitCode).not.toBe(0);
    const { parseCliJson } = await import("./helpers/runCli.js");
    const parsed = parseCliJson<{ ok: boolean; code?: string }>(result.stdout);
    expect(parsed.ok).toBe(false);
  });

  it("rejects lessonkit.json without courseId", async () => {
    const projectDir = await createTempDir();
    tempDirs.push(projectDir);
    await copyMinimalFixture(projectDir);

    const manifest = {
      schemaVersion: 1,
      name: "bad",
      course: {
        title: "Bad",
        layout: "single-spa",
        lessons: [{ id: "l1", title: "L1" }],
      },
      paths: {
        spaDistDir: "dist",
        lxpackOutDir: ".lxpack/course",
        outputBaseDir: ".lxpack/out",
      },
    };
    await writeFile(join(projectDir, "lessonkit.json"), JSON.stringify(manifest, null, 2));

    const result = runCli(["package", "--target", "scorm12", "--json"], { cwd: projectDir });
    expect(result.exitCode).not.toBe(0);
    const { parseCliJson } = await import("./helpers/runCli.js");
    const parsed = parseCliJson<{ ok: boolean }>(result.stdout);
    expect(parsed.ok).toBe(false);
  });

  it("package requires --target", () => {
    const result = runCli(["package", "--json"]);
    expect(result.exitCode).not.toBe(0);
  });
});
