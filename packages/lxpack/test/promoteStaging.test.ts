import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";

const fspMocks = vi.hoisted(() => ({
  rename: vi.fn<typeof import("node:fs/promises").rename>(),
}));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    rename: fspMocks.rename,
  };
});

import { promoteStagingToOutDir } from "../src/packaging/promote";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "lessonkit-lxpack-promote-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  fspMocks.rename.mockReset();
  await Promise.all(tempDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe("promoteStagingToOutDir", () => {
  it("keeps the previous outDir when promote rename fails", async () => {
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "preserve-me.txt"), "original", "utf-8");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(join(stagingDir, "course.yaml"), "title: Test", "utf-8");

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      const destStr = String(dest);
      if (srcStr.endsWith(".tmp-promote") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      "simulated promote failure",
    );

    expect(await readFile(join(outDir, "preserve-me.txt"), "utf-8")).toBe("original");

    const entries = await readdir(root);
    expect(entries.some((name) => name.startsWith("course.failed-promote-"))).toBe(true);
  });

  it("warns when restore fails after promote error", async () => {
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "preserve-me.txt"), "original", "utf-8");
    await mkdir(stagingDir, { recursive: true });

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      const destStr = String(dest);
      if (srcStr.endsWith(".tmp-promote") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      if (destStr === outDir && srcStr.endsWith(".bak")) {
        throw new Error("restore failed");
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      "simulated promote failure",
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/failed to restore/),
      expect.any(String),
    );
    warn.mockRestore();
  });

  it("preserves staged content when outDir is new and promote fails", async () => {
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(join(stagingDir, "course.yaml"), "title: New package", "utf-8");

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      const destStr = String(dest);
      if (srcStr.endsWith(".tmp-promote") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      "simulated promote failure",
    );

    expect(await readFile(join(stagingDir, "course.yaml"), "utf-8")).toBe("title: New package");
  });
});
