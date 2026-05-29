import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  resolveSafePackageOutputOverride,
  validateProjectPaths,
} from "../src/validateProjectPaths";

describe("validateProjectPaths", () => {
  it("accepts ./dist style paths under project root", () => {
    const root = resolve("/tmp/my-project");
    const issues = validateProjectPaths(root, { spaDistDir: "./dist" });
    expect(issues).toHaveLength(0);
  });

  it("accepts safe paths under project root", () => {
    const root = resolve("/tmp/my-project");
    const issues = validateProjectPaths(root, {
      spaDistDir: "dist",
      lxpackOutDir: ".lxpack/course",
      outputBaseDir: ".lxpack/out",
    });
    expect(issues).toHaveLength(0);
  });

  it("rejects path traversal in spaDistDir", () => {
    const root = resolve("/tmp/my-project");
    const issues = validateProjectPaths(root, { spaDistDir: "../../etc" });
    expect(issues.some((i) => i.path === "paths.spaDistDir")).toBe(true);
  });
});

describe("resolveSafePackageOutputOverride", () => {
  let dir: string;

  it("resolves relative override under project root", async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-paths-"));
    const out = resolveSafePackageOutputOverride(dir, "build/out.zip");
    expect(out).toBe(resolve(dir, "build/out.zip"));
    await rm(dir, { recursive: true, force: true });
  });

  it("rejects overrides that escape project root", async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-paths-"));
    expect(() => resolveSafePackageOutputOverride(dir, "../outside.zip")).toThrow(/unsafe/);
    await rm(dir, { recursive: true, force: true });
  });
});
