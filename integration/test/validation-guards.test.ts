import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createTempDir, copyMinimalFixture, installProjectDeps } from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  issues?: Array<{ path?: string; message: string }>;
};

describe("packaging validation guards", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    ensurePackagesBuilt();
  });

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  async function prepareBuiltProject(): Promise<string> {
    const projectDir = await createTempDir();
    tempDirs.push(projectDir);
    await copyMinimalFixture(projectDir);
    await installProjectDeps(projectDir);

    const build = runCliJson<{ ok: boolean }>(["build"], { cwd: projectDir });
    expect(build.result.exitCode).toBe(0);
    expect(build.json.ok).toBe(true);
    return projectDir;
  }

  it("rejects unknown assessment kinds at package time", async () => {
    const projectDir = await prepareBuiltProject();
    const manifestPath = join(projectDir, "lessonkit.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      course: { assessments: unknown[] };
    };
    manifest.course.assessments = [
      { kind: "fillInBlank", checkId: "bad-kind", question: "Fill in?" },
    ];
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: projectDir },
    );
    expect(result.result.exitCode).not.toBe(0);
    expect(result.json.ok).toBe(false);
    const issues = result.json.issues ?? [];
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.path?.includes("kind"))).toBe(true);
  });

  it("rejects incomplete custom themes at package time", async () => {
    const projectDir = await prepareBuiltProject();
    const manifestPath = join(projectDir, "lessonkit.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      course: { theme: unknown };
    };
    manifest.course.theme = {
      theme: {
        name: "corp",
        colors: {},
      },
    };
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: projectDir },
    );
    expect(result.result.exitCode).not.toBe(0);
    expect(result.json.ok).toBe(false);
    const issues = result.json.issues ?? [];
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => (issue.path ?? "").includes("theme"))).toBe(true);
  });
});
