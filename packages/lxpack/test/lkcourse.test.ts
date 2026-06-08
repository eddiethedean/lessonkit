import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  exportLkcourse,
  extractBlockTree,
  importLkcourse,
  parseLkcourseEnvelope,
  validateLkcourse,
} from "../src/lkcourse";
import { parseLessonkitManifest } from "../src/manifest";
import { createZip, isSafeZipEntryPath, readZip } from "../src/lkcourse/zip";

const minimalManifest = {
  schemaVersion: 1 as const,
  name: "lkcourse-test",
  course: {
    courseId: "lkcourse-test",
    title: "Lkcourse Test",
    layout: "single-spa" as const,
    lessons: [{ id: "lesson-1", title: "Lesson one" }],
    assessments: [
      {
        checkId: "ready",
        question: "Ready?",
        choices: ["No", "Yes"],
        answer: "Yes",
        passingScore: 1,
      },
    ],
    theme: { preset: "default" as const },
  },
  paths: {
    spaDistDir: "dist",
    lxpackOutDir: ".lxpack/course",
    outputBaseDir: ".lxpack/out",
  },
};

async function writeMinimalProject(root: string): Promise<void> {
  await mkdir(join(root, "dist", "assets"), { recursive: true });
  await writeFile(join(root, "dist", "index.html"), "<!doctype html><html></html>\n");
  await writeFile(join(root, "dist", "assets", "app.js"), "console.log('ok');\n");
  await writeFile(join(root, "lessonkit.json"), `${JSON.stringify(minimalManifest, null, 2)}\n`);
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(
    join(root, "src", "App.tsx"),
    `
import { Course, Lesson, Quiz } from "@lessonkit/react";
export default function App() {
  return (
    <Course courseId="lkcourse-test" title="Lkcourse Test">
      <Lesson lessonId="lesson-1" title="Lesson one">
        <Quiz checkId="ready" question="Ready?" choices={["No", "Yes"]} answer="Yes" />
      </Lesson>
    </Course>
  );
}
`,
  );
}

function flattenBlocks(
  nodes: Array<{ type: string; checkId?: string; courseId?: string; children?: typeof nodes }>,
): typeof nodes {
  const out: typeof nodes = [];
  for (const node of nodes) {
    out.push(node);
    if (node.children?.length) out.push(...flattenBlocks(node.children));
  }
  return out;
}

describe("lkcourse", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("parses a valid envelope", () => {
    const parsed = parseLkcourseEnvelope({
      format: "lkcourse",
      schemaVersion: 1,
      lessonkitVersion: "1.6.0",
      exportedAt: new Date().toISOString(),
      sourceManifest: minimalManifest,
      entries: ["interchange.json", "dist/index.html"],
    });
    expect(parsed.ok).toBe(true);
  });

  it("rejects invalid envelope format", () => {
    const parsed = parseLkcourseEnvelope({ format: "other" });
    expect(parsed.ok).toBe(false);
  });

  it("exports, validates, and round-trips lessonkit.json", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-export-"));
    tempDirs.push(root);
    await writeMinimalProject(root);

    const manifestParsed = parseLessonkitManifest(minimalManifest);
    expect(manifestParsed.ok).toBe(true);
    if (!manifestParsed.ok) return;

    const exported = await exportLkcourse({
      projectRoot: root,
      manifest: manifestParsed.manifest,
      includeBlockTree: true,
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;

    const validated = validateLkcourse(exported.archivePath);
    expect(validated.ok).toBe(true);

    const importDir = await mkdtemp(join(tmpdir(), "lk-import-"));
    tempDirs.push(importDir);

    const imported = await importLkcourse({
      archivePath: exported.archivePath,
      targetDir: importDir,
    });
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;

    const restored = JSON.parse(await readFile(join(importDir, "lessonkit.json"), "utf8"));
    expect(restored).toEqual(minimalManifest);
    expect(await readFile(join(importDir, "dist", "index.html"), "utf8")).toContain("<!doctype html>");
  });

  it("extracts block tree from src", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-tree-"));
    tempDirs.push(root);
    await writeMinimalProject(root);

    const tree = extractBlockTree({ projectRoot: root });
    expect(tree.schemaVersion).toBe(1);
    expect(tree.sources).toContain("src/App.tsx");
    const flat = flattenBlocks(tree.blocks);
    expect(flat.some((b) => b.type === "Course" && b.courseId === "lkcourse-test")).toBe(true);
    expect(flat.some((b) => b.type === "Quiz" && b.checkId === "ready")).toBe(true);
  });

  it("rejects zip-slip paths", () => {
    expect(isSafeZipEntryPath("../evil")).toBe(false);
    expect(isSafeZipEntryPath("dist/index.html")).toBe(true);
  });

  it("validateLkcourse fails on missing manifest.json", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-bad-"));
    tempDirs.push(root);
    const archive = join(root, "bad.lkcourse");
    const zipped = createZip(new Map([["interchange.json", new TextEncoder().encode("{}")]]));
    await writeFile(archive, zipped);

    const result = validateLkcourse(archive);
    expect(result.ok).toBe(false);
  });

  it("readZip rejects empty archive file", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-empty-"));
    tempDirs.push(root);
    const archive = join(root, "empty.lkcourse");
    await writeFile(archive, "");
    const result = readZip(archive);
    expect(result.ok).toBe(false);
  });

  it("export fails when dist is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-nodist-"));
    tempDirs.push(root);
    await writeFile(join(root, "lessonkit.json"), JSON.stringify(minimalManifest));

    const manifestParsed = parseLessonkitManifest(minimalManifest);
    expect(manifestParsed.ok).toBe(true);
    if (!manifestParsed.ok) return;

    const exported = await exportLkcourse({
      projectRoot: root,
      manifest: manifestParsed.manifest,
    });
    expect(exported.ok).toBe(false);
  });
});
