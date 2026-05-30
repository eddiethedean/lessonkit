import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("lxpack-golden lessonkit.json", () => {
  it("declares a valid single-spa course manifest", () => {
    const manifest = JSON.parse(readFileSync(join(root, "lessonkit.json"), "utf8")) as {
      schemaVersion: number;
      course: {
        courseId: string;
        layout: string;
        lessons: { id: string }[];
      };
    };

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.course.layout).toBe("single-spa");
    expect(manifest.course.courseId.length).toBeGreaterThan(0);
    expect(manifest.course.lessons.length).toBeGreaterThan(0);
  });
});
