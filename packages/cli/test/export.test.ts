import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { runExport } from "../src/commands/export.js";

const manifest = {
  schemaVersion: 1 as const,
  name: "export-cli-test",
  course: {
    courseId: "export-cli-test",
    title: "Export CLI Test",
    layout: "single-spa" as const,
    lessons: [{ id: "lesson-1", title: "Lesson one" }],
    theme: { preset: "default" as const },
  },
  paths: {
    spaDistDir: "dist",
    lxpackOutDir: ".lxpack/course",
    outputBaseDir: ".lxpack/out",
  },
};

describe("runExport", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("fails with --no-build when dist is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-export-cli-"));
    tempDirs.push(root);
    await writeFile(join(root, "lessonkit.json"), JSON.stringify(manifest));
    await writeFile(join(root, "package.json"), JSON.stringify({ name: "export-cli-test" }));

    await expect(
      runExport({ cwd: root, noBuild: true, json: true }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("dist directory not found"),
    });
  });

  it("exports when dist exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-export-cli-"));
    tempDirs.push(root);
    await writeFile(join(root, "lessonkit.json"), JSON.stringify(manifest));
    await writeFile(join(root, "package.json"), JSON.stringify({ name: "export-cli-test" }));
    await mkdir(join(root, "dist", "assets"), { recursive: true });
    await writeFile(join(root, "dist", "index.html"), "<!doctype html><html></html>\n");
    await writeFile(join(root, "dist", "assets", "app.js"), "console.log('ok');\n");

    const result = await runExport({ cwd: root, noBuild: true, json: true });
    expect(result.ok).toBe(true);
    if (result.ok && result.command === "export") {
      expect(result.archivePath).toContain(".lkcourse");
      expect(result.fileCount).toBeGreaterThan(0);
    }
  });
});
