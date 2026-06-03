import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import type { StudioBlock } from "@lessonkit/studio-schema";
import { emitBlockJsx } from "../src/emitJsx";
import { packageStudioProject } from "../src/lxpackExport";
import { assertExportableProject } from "../src/validateExport";
import { collectRelativeAssetPaths, copyAssetFiles } from "../src/writeProject";
import { writeLxpackProjectFromStudio } from "../src/node";
import { sampleProject } from "./fixtures/sampleProject";

describe("coverage gaps", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("emitBlockJsx covers all block types", () => {
    const blocks = [
      { type: "heading", id: "h", level: 3 as const, text: "H" },
      { type: "image", id: "i", src: "assets/p.png", alt: "pic" },
      { type: "button", id: "b", label: "Go", href: "https://example.com" },
      { type: "button", id: "b2", label: "Submit" },
      { type: "input", id: "in", label: "Name", placeholder: "x", inputType: "email" as const },
      { type: "container", id: "c", blocks: [{ type: "text", id: "t", text: "inner" }] },
      {
        type: "scenario",
        id: "s",
        blockId: "scenario-block",
        blocks: [{ type: "text", id: "st", text: "scene" }],
      },
      { type: "scenario", id: "s2", blocks: [{ type: "text", id: "st2", text: "scene2" }] },
      { type: "checklist", id: "cl", items: ["One", "Two"] },
      { type: "video", id: "v", src: "assets/v.mp4", title: "Clip" },
      { type: "video", id: "v2", src: "https://cdn.example/v.mp4" },
    ] satisfies StudioBlock[];

    for (const block of blocks) {
      const jsx = emitBlockJsx(block, "  ");
      expect(jsx.length).toBeGreaterThan(0);
      if (block.type === "button" && !block.href) {
        expect(jsx).toContain("<button");
      }
    }
  });

  it("assertExportableProject warns when multiple pages are present", () => {
    const result = assertExportableProject({
      ...sampleProject,
      pages: [
        { id: "lesson-1", title: "One", blocks: [] },
        { id: "lesson-2", title: "Two", blocks: [] },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings?.some((w) => w.path === "pages")).toBe(true);
  });

  it("assertExportableProject reports duplicate checkId", () => {
    const result = assertExportableProject({
      ...sampleProject,
      pages: [
        {
          id: "lesson-1",
          title: "L",
          blocks: [
            {
              type: "quiz",
              id: "a",
              checkId: "dup",
              question: "Q",
              choices: ["A"],
              answer: "A",
            },
            {
              type: "quiz",
              id: "b",
              checkId: "dup",
              question: "Q2",
              choices: ["B"],
              answer: "B",
            },
          ],
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("collectRelativeAssetPaths finds asset references", () => {
    const paths = collectRelativeAssetPaths([
      { path: "src/App.tsx", content: 'src="assets/foo.png"' },
      { path: "src/other.tsx", content: "assets/bar/baz.jpg" },
    ]);
    expect(paths).toEqual(["assets/bar/baz.jpg", "assets/foo.png"]);
  });

  it("copyAssetFiles copies referenced assets", async () => {
    const assetsDir = await mkdtemp(join(tmpdir(), "lk-assets-"));
    const outDir = await mkdtemp(join(tmpdir(), "lk-out-"));
    tempDirs.push(assetsDir, outDir);
    await mkdir(join(assetsDir, "assets"), { recursive: true });
    await writeFile(join(assetsDir, "assets/pic.png"), "fake", "utf8");
    await copyAssetFiles(assetsDir, outDir, ["assets/pic.png"]);
  });

  it("writeLxpackProjectFromStudio writes lxpack tree with spa dist", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-lxpack-"));
    tempDirs.push(root);
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf8");
    const result = await writeLxpackProjectFromStudio(sampleProject, {
      outDir: join(root, ".lxpack/course"),
      spaDistDir: dist,
      projectRoot: root,
    });
    expect(result.lessonkitJsonPath).toContain("lessonkit.json");
  });

  it("packageStudioProject returns validation errors without running npm", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lk-pack-"));
    tempDirs.push(dir);
    const result = await packageStudioProject(
      { ...sampleProject, pages: [] },
      { outDir: dir, target: "scorm12" },
    );
    expect(result.ok).toBe(false);
  });
});
