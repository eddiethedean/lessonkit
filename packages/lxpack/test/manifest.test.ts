import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseLessonkitManifest } from "../src/manifest";

describe("parseLessonkitManifest", () => {
  it("parses a valid manifest", () => {
    const result = parseLessonkitManifest({
      schemaVersion: 1,
      name: "demo",
      course: {
        courseId: "demo",
        title: "Demo",
        layout: "single-spa",
        lessons: [{ id: "lesson-1", title: "Lesson" }],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.name).toBe("demo");
      expect(result.manifest.paths.spaDistDir).toBe("dist");
    }
  });

  it("rejects per-lesson-spa layout", () => {
    const result = parseLessonkitManifest({
      schemaVersion: 1,
      name: "demo",
      course: {
        courseId: "demo",
        title: "Demo",
        layout: "per-lesson-spa",
        lessons: [{ id: "lesson-1", title: "Lesson", spaPath: "dist/l1" }],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "course.layout")).toBe(true);
    }
  });

  it("validates paths under projectRoot", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lk-manifest-"));
    try {
      const result = parseLessonkitManifest(
        {
          schemaVersion: 1,
          name: "demo",
          course: {
            courseId: "demo",
            title: "Demo",
            layout: "single-spa",
            lessons: [{ id: "lesson-1", title: "Lesson" }],
          },
          paths: { spaDistDir: "../../outside" },
        },
        "lessonkit.json",
        dir,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues.some((i) => i.path.startsWith("paths."))).toBe(true);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("prefixes descriptor validation paths with course.", () => {
    const result = parseLessonkitManifest({
      schemaVersion: 1,
      name: "demo",
      course: {
        courseId: "",
        title: "Demo",
        layout: "single-spa",
        lessons: [{ id: "lesson-1", title: "Lesson" }],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "course.courseId")).toBe(true);
    }
  });

  it("rejects course.spaDistDir mismatch", () => {
    const result = parseLessonkitManifest({
      schemaVersion: 1,
      name: "demo",
      course: {
        courseId: "demo",
        title: "Demo",
        layout: "single-spa",
        spaDistDir: "build/spa",
        lessons: [{ id: "lesson-1", title: "Lesson" }],
      },
      paths: { spaDistDir: "dist" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "course.spaDistDir")).toBe(true);
    }
  });

  it("loadLessonkitManifestFromFile handles read errors", async () => {
    const { loadLessonkitManifestFromFile } = await import("../src/manifest");
    const result = await loadLessonkitManifestFromFile(async () => {
      throw new Error("read failed");
    });
    expect(result.ok).toBe(false);
  });

  it("loads from file via loadLessonkitManifestFromFile", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lk-manifest-file-"));
    try {
      await writeFile(
        join(dir, "lessonkit.json"),
        JSON.stringify({
          schemaVersion: 1,
          name: "file-demo",
          course: {
            courseId: "file-demo",
            title: "File Demo",
            layout: "single-spa",
            lessons: [{ id: "l1", title: "L1" }],
          },
        }),
        "utf8",
      );

      const { loadLessonkitManifestFromFile } = await import("../src/manifest");
      const result = await loadLessonkitManifestFromFile(async () =>
        JSON.parse(await (await import("node:fs/promises")).readFile(join(dir, "lessonkit.json"), "utf8")),
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.manifest.name).toBe("file-demo");
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
