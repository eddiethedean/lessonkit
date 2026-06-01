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
  it("formats recovery errors for non-Error promote failures", async () => {
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(outDir, { recursive: true });
    await mkdir(stagingDir, { recursive: true });

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      const destStr = String(dest);
      if (srcStr.includes(".lk-promote-") && destStr === outDir) {
        throw "string promote failure";
      }
      if (destStr === outDir && srcStr.includes(".lk-backup-")) {
        throw "string restore failure";
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(/Recovery:/);
  });

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
      if (srcStr.includes(".lk-promote-") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      "simulated promote failure",
    );

    expect(await readFile(join(outDir, "preserve-me.txt"), "utf-8")).toBe("original");

    const entries = await readdir(root);
    expect(entries.some((name) => name.startsWith(".lk-failed-promote-"))).toBe(true);
  });

  it("warns when restore to stagingDir fails after promote error without prior outDir", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(join(stagingDir, "course.yaml"), "title: New", "utf-8");

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      const destStr = String(dest);
      if (srcStr.includes(".lk-promote-") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      if (destStr === stagingDir) {
        throw "restore staging failed";
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      "simulated promote failure",
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns when restore fails after promote error", async () => {
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "preserve-me.txt"), "original", "utf-8");
    await mkdir(stagingDir, { recursive: true });

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      const destStr = String(dest);
      if (srcStr.includes(".lk-promote-") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      if (destStr === outDir && srcStr.includes(".lk-backup-")) {
        throw new Error("restore failed");
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      /could not restore.*Recovery: previous output may be in .*\.lk-backup-/,
    );
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
      if (srcStr.includes(".lk-promote-") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      "simulated promote failure",
    );

    expect(await readFile(join(stagingDir, "course.yaml"), "utf-8")).toBe("title: New package");
  });

  it("falls back to copy when rename hits EXDEV", async () => {
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(join(stagingDir, "course.yaml"), "title: EXDEV", "utf-8");

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      if (srcStr === stagingDir) {
        const err = new Error("EXDEV") as NodeJS.ErrnoException;
        err.code = "EXDEV";
        throw err;
      }
      return actualFsp.rename(src, dest);
    });

    await promoteStagingToOutDir(stagingDir, outDir);
    expect(await readFile(join(outDir, "course.yaml"), "utf-8")).toBe("title: EXDEV");
  });

  it("moves staged package to failed-promote after restore succeeds", async () => {
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "old.txt"), "old", "utf-8");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(join(stagingDir, "course.yaml"), "title: staged", "utf-8");

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      const destStr = String(dest);
      if (srcStr.includes(".lk-promote-") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      "simulated promote failure",
    );
    expect(await readFile(join(outDir, "old.txt"), "utf-8")).toBe("old");
    const entries = await readdir(root);
    expect(entries.some((name) => name.startsWith(".lk-failed-promote-"))).toBe(true);
  });

  it("cleans up tmpPromote when failed-promote move fails after restore", async () => {
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "old.txt"), "old", "utf-8");
    await mkdir(stagingDir, { recursive: true });

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      const destStr = String(dest);
      if (srcStr.includes(".lk-promote-") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      if (destStr.includes(".lk-failed-promote-")) {
        throw new Error("failed-promote move failed");
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      "simulated promote failure",
    );
    const entries = await readdir(root);
    expect(entries.some((name) => name.startsWith(".lk-failed-promote-"))).toBe(false);
  });

  it("throws recovery error when restore and failed-promote move both fail", async () => {
    const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, "preserve-me.txt"), "original", "utf-8");
    await mkdir(stagingDir, { recursive: true });

    fspMocks.rename.mockImplementation(async (src, dest) => {
      const srcStr = String(src);
      const destStr = String(dest);
      if (srcStr.includes(".lk-promote-") && destStr === outDir) {
        throw new Error("simulated promote failure");
      }
      if (destStr === outDir && srcStr.includes(".lk-backup-")) {
        throw new Error("restore failed");
      }
      if (destStr.includes(".lk-failed-promote-")) {
        throw new Error("failed-promote move failed");
      }
      return actualFsp.rename(src, dest);
    });

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(/Recovery:/);
  });

  it("rejects promote when legacy .bak or .tmp-promote artifacts exist", async () => {
    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(outDir, { recursive: true });
    await mkdir(stagingDir, { recursive: true });
    await writeFile(`${outDir}.bak`, "stale", "utf-8");

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      /remove stale packaging artifacts/,
    );
  });

  it("rejects promote when legacy .tmp-promote artifact exists", async () => {
    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(outDir, { recursive: true });
    await mkdir(stagingDir, { recursive: true });
    await writeFile(`${outDir}.tmp-promote`, "stale", "utf-8");

    await expect(promoteStagingToOutDir(stagingDir, outDir)).rejects.toThrow(
      /remove stale packaging artifacts/,
    );
  });
});
