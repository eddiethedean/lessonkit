import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { packageLessonkitCourse } from "@lessonkit/lxpack";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe("xAPI packaging preflight", () => {
  it("rejects xapi target when tracking.xapi.activityIri is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-xapi-"));
    tempDirs.push(root);
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf8");

    const result = await packageLessonkitCourse({
      descriptor: {
        courseId: "demo",
        title: "Demo",
        layout: "single-spa",
        lessons: [{ id: "main", title: "Main" }],
        assessments: [],
      },
      outDir: join(root, "course"),
      spaDistDir: dist,
      projectRoot: root,
      target: "xapi",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === "tracking.xapi.activityIri")).toBe(true);
    }
  });
});
