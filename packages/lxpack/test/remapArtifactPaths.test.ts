import { join, resolve, win32 as pathWin32 } from "node:path";
import { describe, expect, it } from "vitest";
import { isResolvedPathUnderRoot } from "../src/spaPath";
import { remapArtifactPaths } from "../src/packaging/validateInputs";

describe("isResolvedPathUnderRoot", () => {
  it("matches child paths regardless of separator style in input", () => {
    const root = resolve("/tmp/lessonkit-staging");
    const child = join(root, "out", "course-scorm12.zip");
    expect(isResolvedPathUnderRoot(root, child)).toBe(true);
    expect(isResolvedPathUnderRoot(root, root)).toBe(true);
    expect(isResolvedPathUnderRoot(root, resolve("/tmp/other"))).toBe(false);
  });

  it("treats win32-style resolved paths as under the same root", () => {
    const stagingRoot = pathWin32.resolve("C:\\lxpack\\staging");
    const artifact = pathWin32.resolve("C:\\lxpack\\staging\\course-scorm12.zip");
    expect(isResolvedPathUnderRoot(stagingRoot, artifact)).toBe(true);
  });
});

describe("remapArtifactPaths", () => {
  it("remaps artifact paths under staging to outDir", () => {
    const stagingRoot = resolve("/tmp/staging");
    const outDir = resolve("/tmp/out");
    const artifact = join(stagingRoot, "nested", "course-scorm12.zip");
    expect(remapArtifactPaths(stagingRoot, outDir, artifact)).toBe(
      join(outDir, "nested", "course-scorm12.zip"),
    );
  });

  it("remaps win32 staging paths to outDir", () => {
    const stagingRoot = pathWin32.resolve("C:\\lxpack\\staging");
    const outDir = pathWin32.resolve("C:\\lxpack\\out");
    const artifact = pathWin32.resolve("C:\\lxpack\\staging\\course-scorm12.zip");
    expect(remapArtifactPaths(stagingRoot, outDir, artifact)).toBe(
      pathWin32.join(outDir, "course-scorm12.zip"),
    );
  });

  it("returns undefined for missing artifact path", () => {
    expect(remapArtifactPaths("/a", "/b", undefined)).toBeUndefined();
  });

  it("passes through paths outside staging", () => {
    const outside = resolve("/elsewhere/pkg.zip");
    expect(remapArtifactPaths(resolve("/staging"), resolve("/out"), outside)).toBe(outside);
  });

  it("remaps when staging root differs only by drive letter casing on win32 paths", () => {
    const stagingRoot = pathWin32.resolve("c:\\lxpack\\staging");
    const outDir = pathWin32.resolve("C:\\lxpack\\out");
    const artifact = pathWin32.resolve("C:\\lxpack\\staging\\course-scorm12.zip");
    expect(remapArtifactPaths(stagingRoot, outDir, artifact)).toBe(
      pathWin32.join(outDir, "course-scorm12.zip"),
    );
  });
});
