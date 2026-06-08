import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { zipSync, strToU8 } from "fflate";
import { afterEach, describe, expect, it, vi } from "vitest";
import { descriptorToInterchange } from "../src/interchange";
import {
  exportLkcourse,
  extractBlockTree,
  importLkcourse,
  parseLkcourseEnvelope,
  validateLkcourse,
  validateLkcourseArchiveEntries,
} from "../src/lkcourse";
import { parseLessonkitManifest } from "../src/manifest";
import {
  createZip,
  ensureParentDir,
  isSafeZipEntryPath,
  readZip,
  statArchiveSize,
  utf8ToEntry,
} from "../src/lkcourse/zip";

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
  nodes: Array<{
    type: string;
    checkId?: string;
    courseId?: string;
    rawTag?: string;
    children?: typeof nodes;
  }>,
): typeof nodes {
  const out: typeof nodes = [];
  for (const node of nodes) {
    out.push(node);
    if (node.children?.length) out.push(...flattenBlocks(node.children));
  }
  return out;
}

function buildArchiveEntries(opts?: {
  interchange?: unknown;
  manifestEnvelope?: Record<string, unknown>;
  omit?: string[];
}): Map<string, Uint8Array> {
  const interchange =
    opts?.interchange ?? descriptorToInterchange(minimalManifest.course);
  const envelope = {
    format: "lkcourse",
    schemaVersion: 1,
    lessonkitVersion: "1.6.0",
    exportedAt: new Date().toISOString(),
    sourceManifest: minimalManifest,
    entries: ["interchange.json", "dist/index.html"],
    ...opts?.manifestEnvelope,
  };
  const entries = new Map<string, Uint8Array>([
    ["interchange.json", utf8ToEntry(JSON.stringify(interchange))],
    ["dist/index.html", utf8ToEntry("<!doctype html><html></html>")],
    ["manifest.json", utf8ToEntry(JSON.stringify(envelope))],
  ]);
  for (const key of opts?.omit ?? []) entries.delete(key);
  return entries;
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

  it("export rejects block tree with invalid ids", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-tree-invalid-"));
    tempDirs.push(root);
    await writeMinimalProject(root);
    await writeFile(
      join(root, "src", "Bad.tsx"),
      `<Quiz checkId="bad:id" question="?" choices={["a"]} answer="a" />`,
    );

    const manifestParsed = parseLessonkitManifest(minimalManifest);
    expect(manifestParsed.ok).toBe(true);
    if (!manifestParsed.ok) return;

    const exported = await exportLkcourse({
      projectRoot: root,
      manifest: manifestParsed.manifest,
      includeBlockTree: true,
    });
    expect(exported.ok).toBe(false);
    if (exported.ok) return;
    expect(exported.issues.some((issue) => issue.path.includes("block-tree"))).toBe(true);
  });

  it("rejects zip-slip paths", () => {
    expect(isSafeZipEntryPath("../evil")).toBe(false);
    expect(isSafeZipEntryPath("dist/index.html")).toBe(true);
    expect(isSafeZipEntryPath("/absolute")).toBe(false);
    expect(isSafeZipEntryPath("dist/\0evil")).toBe(false);
    expect(isSafeZipEntryPath("dist/../lessonkit.json")).toBe(false);
  });

  it("readZip rejects normalized traversal paths in dist prefix", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-zip-traverse-"));
    tempDirs.push(root);
    const archive = join(root, "traverse.lkcourse");
    const zipped = zipSync({ "dist/../lessonkit.json": strToU8("tampered") });
    await writeFile(archive, zipped);
    const result = readZip(archive);
    expect(result.ok).toBe(false);
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

  it("validateLkcourse rejects invalid interchange.json", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-bad-interchange-"));
    tempDirs.push(root);
    const archive = join(root, "bad-interchange.lkcourse");
    const envelope = {
      format: "lkcourse",
      schemaVersion: 1,
      lessonkitVersion: "1.6.0",
      exportedAt: new Date().toISOString(),
      sourceManifest: minimalManifest,
      entries: ["manifest.json", "interchange.json"],
    };
    const zipped = createZip(
      new Map([
        ["manifest.json", new TextEncoder().encode(JSON.stringify(envelope))],
        ["interchange.json", new TextEncoder().encode("{not-valid-json")],
      ]),
    );
    await writeFile(archive, zipped);
    const result = validateLkcourse(archive);
    expect(result.ok).toBe(false);
  });

  it("importLkcourse fails on invalid archive", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-import-bad-"));
    tempDirs.push(root);
    const archive = join(root, "broken.lkcourse");
    await writeFile(archive, "not-a-zip");
    const target = await mkdtemp(join(tmpdir(), "lk-import-target-"));
    tempDirs.push(target);
    const result = await importLkcourse({ archivePath: archive, targetDir: target });
    expect(result.ok).toBe(false);
  });

  it("export writes to a custom out path", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-custom-out-"));
    tempDirs.push(root);
    await writeMinimalProject(root);

    const manifestParsed = parseLessonkitManifest(minimalManifest);
    expect(manifestParsed.ok).toBe(true);
    if (!manifestParsed.ok) return;

    const exported = await exportLkcourse({
      projectRoot: root,
      manifest: manifestParsed.manifest,
      outPath: "custom-export.lkcourse",
    });
    expect(exported.ok).toBe(true);
    if (exported.ok) {
      expect(exported.archivePath).toContain("custom-export.lkcourse");
    }
  });

  it("validateLkcourse rejects course id mismatch", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-mismatch-"));
    tempDirs.push(root);
    const archive = join(root, "mismatch.lkcourse");
    const badInterchange = {
      schemaVersion: 1,
      course: { id: "wrong-id", title: "Wrong", lessons: [] },
    };
    const envelope = {
      format: "lkcourse",
      schemaVersion: 1,
      lessonkitVersion: "1.6.0",
      exportedAt: new Date().toISOString(),
      sourceManifest: minimalManifest,
      entries: ["manifest.json", "interchange.json"],
    };
    const zipped = createZip(
      new Map([
        ["manifest.json", new TextEncoder().encode(JSON.stringify(envelope))],
        ["interchange.json", new TextEncoder().encode(JSON.stringify(badInterchange))],
      ]),
    );
    await writeFile(archive, zipped);
    const result = validateLkcourse(archive);
    expect(result.ok).toBe(false);
  });

  it("extractBlockTree returns empty blocks when src is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-empty-src-"));
    tempDirs.push(root);
    const tree = extractBlockTree({ projectRoot: root });
    expect(tree.blocks).toEqual([]);
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

  it("validateLkcourseArchiveEntries accepts a complete archive", () => {
    const result = validateLkcourseArchiveEntries(buildArchiveEntries(), "test.lkcourse");
    expect(result.ok).toBe(true);
  });

  it("validateLkcourseArchiveEntries rejects invalid manifest JSON", () => {
    const entries = buildArchiveEntries();
    entries.set("manifest.json", utf8ToEntry("{not-json"));
    const result = validateLkcourseArchiveEntries(entries, "bad.lkcourse");
    expect(result.ok).toBe(false);
  });

  it("validateLkcourseArchiveEntries rejects missing interchange.json", () => {
    const result = validateLkcourseArchiveEntries(
      buildArchiveEntries({ omit: ["interchange.json"] }),
      "no-interchange.lkcourse",
    );
    expect(result.ok).toBe(false);
  });

  it("validateLkcourseArchiveEntries rejects missing dist index.html", () => {
    const result = validateLkcourseArchiveEntries(
      buildArchiveEntries({ omit: ["dist/index.html"] }),
      "no-index.lkcourse",
    );
    expect(result.ok).toBe(false);
  });

  it("validateLkcourseArchiveEntries rejects listed entry missing from zip", () => {
    const entries = buildArchiveEntries({
      manifestEnvelope: { entries: ["interchange.json", "dist/index.html", "dist/assets/app.js"] },
    });
    const result = validateLkcourseArchiveEntries(entries, "missing-listed.lkcourse");
    expect(result.ok).toBe(false);
  });

  it("validateLkcourseArchiveEntries rejects invalid interchange schema", () => {
    const result = validateLkcourseArchiveEntries(
      buildArchiveEntries({ interchange: { schemaVersion: 1, course: { lessons: [] } } }),
      "bad-schema.lkcourse",
    );
    expect(result.ok).toBe(false);
  });

  it("validateLkcourseArchiveEntries rejects missing interchange course id", () => {
    const interchange = descriptorToInterchange(minimalManifest.course);
    const withoutId = {
      ...interchange,
      course: { ...interchange.course, id: undefined },
    };
    const result = validateLkcourseArchiveEntries(
      buildArchiveEntries({ interchange: withoutId }),
      "no-course-id.lkcourse",
    );
    expect(result.ok).toBe(false);
  });

  it("validateLkcourseArchiveEntries rejects course id mismatch", () => {
    const interchange = descriptorToInterchange(minimalManifest.course);
    const wrongId = {
      ...interchange,
      course: { ...interchange.course, id: "other-course" },
    };
    const result = validateLkcourseArchiveEntries(
      buildArchiveEntries({ interchange: wrongId }),
      "mismatch.lkcourse",
    );
    expect(result.ok).toBe(false);
  });

  it("extractBlockTree parses nested JSX and unknown tags", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-nested-"));
    tempDirs.push(root);
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(
      join(root, "src", "Nested.tsx"),
      `
export function Nested() {
  return (
    <Course courseId="c1">
      <Lesson lessonId="l1">
        <Quiz checkId="q1" />
        <CustomWidget />
        <Text>leaf</Text>
      </Lesson>
    </Course>
  );
}
`,
    );
    const tree = extractBlockTree({
      projectRoot: root,
      appSources: ["src/Nested.tsx"],
      blockTypes: ["Course", "Lesson", "Quiz", "Text"],
    });
    const flat = flattenBlocks(tree.blocks);
    expect(flat.some((b) => b.type === "Course" && b.courseId === "c1")).toBe(true);
    expect(flat.some((b) => b.type === "Unknown" && b.rawTag === "CustomWidget")).toBe(true);
  });

  it("export rejects unsafe output path", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-unsafe-out-"));
    tempDirs.push(root);
    await writeMinimalProject(root);
    const manifestParsed = parseLessonkitManifest(minimalManifest);
    expect(manifestParsed.ok).toBe(true);
    if (!manifestParsed.ok) return;

    const exported = await exportLkcourse({
      projectRoot: root,
      manifest: manifestParsed.manifest,
      outPath: "../escape.lkcourse",
    });
    expect(exported.ok).toBe(false);
  });

  it("export fails when dist has no index.html", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-no-index-"));
    tempDirs.push(root);
    await mkdir(join(root, "dist", "assets"), { recursive: true });
    await writeFile(join(root, "dist", "assets", "app.js"), "console.log(1);\n");
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

  it("export fails when dist contains a symlink", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-symlink-"));
    tempDirs.push(root);
    await mkdir(join(root, "dist"), { recursive: true });
    await writeFile(join(root, "dist", "index.html"), "<html></html>\n");
    await writeFile(join(root, "dist", "real.js"), "export {};\n");
    await symlink(join(root, "dist", "real.js"), join(root, "dist", "link.js"));
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

  it("createZip throws on unsafe entry paths", () => {
    expect(() => createZip(new Map([["../evil", utf8ToEntry("x")]]))).toThrow(/unsafe zip entry/);
  });

  it("readZip rejects archives with unsafe entry paths", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-unsafe-zip-"));
    tempDirs.push(root);
    const archive = join(root, "unsafe.lkcourse");
    const zipped = zipSync({ "../evil": strToU8("payload") });
    await writeFile(archive, zipped);
    const result = readZip(archive);
    expect(result.ok).toBe(false);
  });

  it("readZip fails when archive file is missing", () => {
    const result = readZip(join(tmpdir(), "missing-archive-xyz.lkcourse"));
    expect(result.ok).toBe(false);
  });

  it("importLkcourse rejects unsafe dist extraction paths", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-import-unsafe-"));
    tempDirs.push(root);
    await writeMinimalProject(root);
    const manifestParsed = parseLessonkitManifest(minimalManifest);
    expect(manifestParsed.ok).toBe(true);
    if (!manifestParsed.ok) return;

    const exported = await exportLkcourse({
      projectRoot: root,
      manifest: manifestParsed.manifest,
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;

    const importDir = await mkdtemp(join(tmpdir(), "lk-import-unsafe-target-"));
    tempDirs.push(importDir);
    const zipModule = await import("../src/lkcourse/zip");
    const original = zipModule.isSafeZipEntryPath;
    const spy = vi.spyOn(zipModule, "isSafeZipEntryPath").mockImplementation((p) => {
      if (p === "dist/assets/app.js") return false;
      return original(p);
    });

    const result = await importLkcourse({
      archivePath: exported.archivePath,
      targetDir: importDir,
    });
    expect(result.ok).toBe(false);
    spy.mockRestore();
  });

  it("extractBlockTree handles unclosed tags and text-only inner content", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-unclosed-"));
    tempDirs.push(root);
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(
      join(root, "src", "Shapes.tsx"),
      `
export const Shapes = () => (
  <>
    <Course courseId="c1"><Lesson lessonId="l1">plain text</Lesson></Course>
    <Quiz checkId={"braced"} />
    <BrokenTag courseId="orphan">
  </>
);
`,
    );
    const tree = extractBlockTree({
      projectRoot: root,
      appSources: ["src/Shapes.tsx"],
      blockTypes: ["Course", "Lesson", "Quiz"],
    });
    const flat = flattenBlocks(tree.blocks);
    expect(flat.some((b) => b.type === "Quiz" && b.checkId === "braced")).toBe(true);
    expect(flat.some((b) => b.type === "Course" && b.children?.length)).toBe(true);
  });

  it("extractBlockTree parses self-closing tags and single-quoted ids", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-selfclose-"));
    tempDirs.push(root);
    await mkdir(join(root, "src"), { recursive: true });
    await writeFile(
      join(root, "src", "SelfClose.tsx"),
      `export const App = () => <Quiz checkId='quoted-id' />;`,
    );
    const tree = extractBlockTree({
      projectRoot: root,
      appSources: ["src/SelfClose.tsx"],
      blockTypes: ["Quiz"],
    });
    expect(tree.blocks[0]?.checkId).toBe("quoted-id");
  });

  it("zip helpers expose parent dir and archive size", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-zip-helpers-"));
    tempDirs.push(root);
    const archive = join(root, "nested", "archive.lkcourse");
    await mkdir(join(root, "nested"), { recursive: true });
    const zipped = createZip(new Map([["dist/index.html", utf8ToEntry("<html></html>")]]));
    await writeFile(archive, zipped);
    expect(ensureParentDir(archive)).toContain("nested");
    expect(statArchiveSize(archive)).toBeGreaterThan(0);
  });
});
