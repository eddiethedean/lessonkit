import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runPackage } from "../src/commands/package.js";

describe("runPackage integration (real lxpack validation)", () => {
  let dir: string;
  const originalNodeVersion = process.versions.node;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-cli-pkg-int-"));
    await writeFile(join(dir, "package.json"), JSON.stringify({ devDependencies: { vite: "^7" } }), "utf8");
    await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
    await writeFile(join(dir, "node_modules", "vite", "bin", "vite.js"), "", "utf8");
    await mkdir(join(dir, "dist"), { recursive: true });
    await writeFile(join(dir, "dist", "index.html"), "<html></html>", "utf8");
    Object.defineProperty(process.versions, "node", { value: "20.0.0", configurable: true });
  });

  afterEach(async () => {
    Object.defineProperty(process.versions, "node", { value: originalNodeVersion, configurable: true });
    await rm(dir, { recursive: true, force: true });
  });

  it("rejects invalid courseId with real lxpack descriptor validation", async () => {
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1,
        name: "invalid",
        course: {
          courseId: "1bad-id",
          title: "Invalid",
          layout: "single-spa",
          lessons: [{ id: "l1", title: "L1" }],
        },
      }),
      "utf8",
    );

    await expect(runPackage({ target: "scorm12", cwd: dir, noBuild: true })).rejects.toMatchObject({
      code: "INVALID_PROJECT",
    });
  });
});
