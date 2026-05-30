import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { resolveSpaDirs } from "../src/spaDirs";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe("resolveSpaDirs", () => {
  it("maps single-spa layout to one lesson folder", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-spa-"));
    tempDirs.push(root);
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf8");

    const dirs = await resolveSpaDirs({
      descriptor: {
        courseId: "c",
        title: "T",
        layout: "single-spa",
        lessons: [{ id: "main", title: "Main" }],
        assessments: [],
      },
      spaDistDir: "dist",
      projectRoot: root,
    });

    expect(dirs.main).toBe(dist);
  });

  it("throws when spaDistDir is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-spa-"));
    tempDirs.push(root);

    await expect(
      resolveSpaDirs({
        descriptor: {
          courseId: "c",
          title: "T",
          layout: "single-spa",
          lessons: [{ id: "main", title: "Main" }],
          assessments: [],
        },
        spaDistDir: "dist",
        projectRoot: root,
      }),
    ).rejects.toThrow(/spaDistDir not found/);
  });

  it("throws when spaDistDir exists but index.html is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-spa-"));
    tempDirs.push(root);
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });

    await expect(
      resolveSpaDirs({
        descriptor: {
          courseId: "c",
          title: "T",
          layout: "single-spa",
          lessons: [{ id: "main", title: "Main" }],
          assessments: [],
        },
        spaDistDir: "dist",
        projectRoot: root,
      }),
    ).rejects.toThrow(/index\.html/);
  });

  it("requires lessonSpaDirs for multi-lesson layout", async () => {
    await expect(
      resolveSpaDirs({
        descriptor: {
          courseId: "c",
          title: "T",
          layout: "per-lesson-spa",
          lessons: [
            { id: "a", title: "A" },
            { id: "b", title: "B" },
          ],
          assessments: [],
        },
      }),
    ).rejects.toThrow(/lessonSpaDirs missing/);
  });

  it("maps per-lesson-spa layout when lessonSpaDirs contain index.html", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-spa-"));
    tempDirs.push(root);
    const lessonA = join(root, "dist-a");
    const lessonB = join(root, "dist-b");
    await mkdir(lessonA, { recursive: true });
    await mkdir(lessonB, { recursive: true });
    await writeFile(join(lessonA, "index.html"), "<html></html>", "utf8");
    await writeFile(join(lessonB, "index.html"), "<html></html>", "utf8");

    const dirs = await resolveSpaDirs({
      descriptor: {
        courseId: "c",
        title: "T",
        layout: "per-lesson-spa",
        lessons: [
          { id: "a", title: "A" },
          { id: "b", title: "B" },
        ],
        assessments: [],
      },
      lessonSpaDirs: { a: "dist-a", b: "dist-b" },
      projectRoot: root,
    });

    expect(dirs.a).toBe(lessonA);
    expect(dirs.b).toBe(lessonB);
  });

  it("throws when per-lesson-spa lesson dir is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-spa-"));
    tempDirs.push(root);

    await expect(
      resolveSpaDirs({
        descriptor: {
          courseId: "c",
          title: "T",
          layout: "per-lesson-spa",
          lessons: [{ id: "a", title: "A" }],
          assessments: [],
        },
        lessonSpaDirs: { a: "missing-dist" },
        projectRoot: root,
      }),
    ).rejects.toThrow(/path not found for lesson "a"/);
  });

  it("throws when per-lesson-spa lesson dir lacks index.html", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-spa-"));
    tempDirs.push(root);
    const lessonA = join(root, "dist-a");
    await mkdir(lessonA, { recursive: true });

    await expect(
      resolveSpaDirs({
        descriptor: {
          courseId: "c",
          title: "T",
          layout: "per-lesson-spa",
          lessons: [{ id: "a", title: "A" }],
          assessments: [],
        },
        lessonSpaDirs: { a: "dist-a" },
        projectRoot: root,
      }),
    ).rejects.toThrow(/index\.html.*lesson "a"/);
  });

  it("rejects per-lesson-spa paths that escape projectRoot", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-spa-"));
    tempDirs.push(root);

    await expect(
      resolveSpaDirs({
        descriptor: {
          courseId: "c",
          title: "T",
          layout: "per-lesson-spa",
          lessons: [{ id: "a", title: "A" }],
          assessments: [],
        },
        lessonSpaDirs: { a: "../outside" },
        projectRoot: root,
      }),
    ).rejects.toThrow(/unsafe path escapes project root/);
  });
});
