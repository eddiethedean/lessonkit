import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { writeReactViteProject } from "../src/node";
import { relativizePaths } from "../src/writeProject";
import { sampleProject } from "./fixtures/sampleProject";

describe("writeReactViteProject", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("writes files to disk", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lk-codegen-"));
    tempDirs.push(dir);
    await writeReactViteProject(sampleProject, { outDir: dir, exportMode: "renderer" });
    const main = await readFile(join(dir, "src/main.tsx"), "utf8");
    expect(main).toContain("StudioRenderer");
    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    expect(pkg.dependencies["@lessonkit/studio-renderer"]).toBeDefined();
  });

  it("relativizePaths returns dot for same directory", () => {
    const dir = resolve("/tmp/project");
    expect(relativizePaths(dir, dir)).toBe(".");
  });
});
