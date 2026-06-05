import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validatePackageInputs } from "../src/packaging/validateInputs";
import { isSafeRelativeSpaPath } from "../src/spaPath";
import { validateProjectPaths } from "../src/validateProjectPaths";

describe("realpath path validation", () => {
  it("rejects spaDistDir of only a dot segment", () => {
    expect(isSafeRelativeSpaPath(".")).toBe(false);
    expect(isSafeRelativeSpaPath("./")).toBe(false);
  });

  it("rejects lxpackOutDir symlink that escapes project root", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-realpath-"));
    const outside = await mkdtemp(join(tmpdir(), "lk-outside-"));
    try {
      const linkPath = join(root, "escape-link");
      await symlink(outside, linkPath, "dir");
      const issues = validateProjectPaths(root, { lxpackOutDir: "escape-link" });
      expect(issues.some((i) => i.path === "paths.lxpackOutDir")).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("rejects outDir symlink escape in validatePackageInputs", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-pkg-realpath-"));
    const outside = await mkdtemp(join(tmpdir(), "lk-pkg-outside-"));
    try {
      await mkdir(join(root, ".lxpack"), { recursive: true });
      const linkPath = join(root, ".lxpack", "course-link");
      await symlink(outside, linkPath, "dir");
      const result = validatePackageInputs({
        target: "scorm12",
        outDir: linkPath,
        projectRoot: root,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues.some((i) => i.path === "outDir")).toBe(true);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("rejects lxpackOutDir when a parent path component is a symlink escape", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-parent-symlink-"));
    const outside = await mkdtemp(join(tmpdir(), "lk-outside-parent-"));
    try {
      await symlink(outside, join(root, ".lxpack"), "dir");
      const issues = validateProjectPaths(root, { lxpackOutDir: ".lxpack/course" });
      expect(issues.some((i) => i.path === "paths.lxpackOutDir")).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("rejects output symlink escape in validatePackageInputs", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-output-realpath-"));
    const outside = await mkdtemp(join(tmpdir(), "lk-output-outside-"));
    try {
      await mkdir(join(root, ".lxpack", "course"), { recursive: true });
      await writeFile(join(outside, "course.zip"), "");
      const linkPath = join(root, "escape-out.zip");
      await symlink(join(outside, "course.zip"), linkPath);
      const result = validatePackageInputs({
        target: "scorm12",
        outDir: join(root, ".lxpack", "course"),
        projectRoot: root,
        output: "escape-out.zip",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues.some((i) => i.path === "output")).toBe(true);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });
});
