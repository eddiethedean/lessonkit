import { mkdir, mkdtemp, symlink, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { assertSpaDistContentsSafe } from "../src/spaDistValidation";

const tempDirs: string[] = [];
afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe("assertSpaDistContentsSafe", () => {
  it("rejects a dist root that is a symlink outside the project", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-spa-safe-"));
    tempDirs.push(root);
    const external = await mkdtemp(join(tmpdir(), "lk-spa-external-"));
    tempDirs.push(external);
    await writeFile(join(external, "secret.txt"), "outside", "utf-8");
    const linkPath = join(root, "dist-link");
    await symlink(external, linkPath);

    await expect(assertSpaDistContentsSafe({ main: linkPath })).rejects.toThrow(/cannot be a symlink/);
  });

  it("rejects symlinks inside the dist tree", async () => {
    const root = await mkdtemp(join(tmpdir(), "lk-spa-inner-"));
    tempDirs.push(root);
    const dist = join(root, "dist");
    await mkdir(dist, { recursive: true });
    await writeFile(join(dist, "index.html"), "<html></html>", "utf-8");
    const outside = join(root, "outside.txt");
    await writeFile(outside, "x", "utf-8");
    await symlink(outside, join(dist, "link.txt"));

    await expect(assertSpaDistContentsSafe({ main: dist })).rejects.toThrow(/contains symlink/);
  });
});
