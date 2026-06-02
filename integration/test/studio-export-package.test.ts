import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadStudioProject } from "@lessonkit/studio-schema";
import { writeReactViteProject } from "@lessonkit/studio-codegen/node";
import { assertScormZip, assertViteDist } from "./helpers/assertArtifacts.js";
import { INTEGRATION_ROOT } from "./helpers/paths.js";
import { createTempDir, installProjectDeps, patchPackageJsonForMonorepo } from "./helpers/tempProject.js";
import { ensurePackagesBuilt, runCliJson, runNpm } from "./helpers/runCli.js";

type PackageJson = {
  ok: boolean;
  target?: string;
  outputPath?: string;
};

describe("Studio codegen → build → package", () => {
  const tempDirs: string[] = [];

  beforeAll(() => {
    ensurePackagesBuilt();
  });

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("exports renderer-mode Vite project and packages SCORM 1.2", async () => {
    const fixturePath = join(INTEGRATION_ROOT, "fixtures/studio-export/project.json");
    const raw = JSON.parse(await readFile(fixturePath, "utf8")) as unknown;
    const loaded = loadStudioProject(raw);
    if (!loaded.ok) {
      throw new Error(JSON.stringify(loaded.issues));
    }

    const projectDir = await createTempDir("lk-studio-export-");
    tempDirs.push(projectDir);

    await writeReactViteProject(loaded.project, {
      outDir: projectDir,
      exportMode: "renderer",
      lessonkitVersion: "1.0.2",
      studioVersion: "0.3.0",
    });

    await patchPackageJsonForMonorepo(join(projectDir, "package.json"));
    await installProjectDeps(projectDir);

    const build = runNpm(["run", "build"], { cwd: projectDir });
    if (build.exitCode !== 0) {
      throw new Error(`vite build failed:\n${build.stdout}\n${build.stderr}`);
    }
    assertViteDist(join(projectDir, "dist"));

    const scorm = runCliJson<PackageJson>(
      ["package", "--target", "scorm12", "--no-build"],
      { cwd: projectDir },
    );
    expect(scorm.result.exitCode).toBe(0);
    expect(scorm.json.ok).toBe(true);

    const scormZip =
      scorm.json.outputPath ??
      join(projectDir, ".lxpack/course/.lxpack/out/course-scorm12.zip");
    assertScormZip(scormZip);

    const main = await readFile(join(projectDir, "src/main.tsx"), "utf8");
    expect(main).toContain("StudioRenderer");
    expect(main).not.toContain("import App from");

    const projectJson = JSON.parse(await readFile(join(projectDir, "src/project.json"), "utf8"));
    expect(projectJson.pages).toHaveLength(2);
  }, 600_000);
});
