import { mkdir, mkdtemp, readdir, readFile, rm, writeFile, utimes } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

async function restoreRenameMock(): Promise<void> {
  const actualFsp = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  fspMocks.rename.mockImplementation(actualFsp.rename);
}

afterEach(async () => {
  await restoreRenameMock();
  await Promise.all(tempDirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

beforeEach(async () => {
  await restoreRenameMock();
});

describe("promoteStagingToOutDir", () => {
  async function makeTempDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "lessonkit-lxpack-promote-"));
    tempDirs.push(dir);
    return dir;
  }

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

  it("rejects promote when fresh legacy .bak artifact exists", async () => {
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

  it("auto-removes stale legacy .bak artifacts before promote", async () => {
    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(join(stagingDir, "course.yaml"), "title: New", "utf-8");
    const legacyBak = `${outDir}.bak`;
    await writeFile(legacyBak, "stale", "utf-8");
    const old = new Date(Date.now() - 10 * 60 * 1000);
    await utimes(legacyBak, old, old);

    await promoteStagingToOutDir(stagingDir, outDir);
    expect(await readFile(join(outDir, "course.yaml"), "utf-8")).toBe("title: New");
  });

  it("rejects promote when fresh legacy .tmp-promote artifact exists", async () => {
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

  it("preserves prior .lxpack/out artifacts when promoting a new target", async () => {
    const root = await makeTempDir();
    const outDir = join(root, "course");
    const outputBase = ".lxpack/out";

    const scormStaging = join(root, "staging-scorm");
    await mkdir(join(scormStaging, outputBase), { recursive: true });
    await writeFile(join(scormStaging, "course.yaml"), "title: scorm", "utf-8");
    await writeFile(join(scormStaging, outputBase, "course-scorm12.zip"), "zip-bytes", "utf-8");
    await promoteStagingToOutDir(scormStaging, outDir);

    const standaloneStaging = join(root, "staging-standalone");
    await mkdir(join(standaloneStaging, outputBase, "standalone"), { recursive: true });
    await writeFile(join(standaloneStaging, "course.yaml"), "title: standalone", "utf-8");
    await writeFile(join(standaloneStaging, outputBase, "standalone", "index.html"), "<html></html>", "utf-8");
    await promoteStagingToOutDir(standaloneStaging, outDir);

    expect(await readFile(join(outDir, "course.yaml"), "utf-8")).toBe("title: standalone");
    expect(await readFile(join(outDir, outputBase, "course-scorm12.zip"), "utf-8")).toBe("zip-bytes");
    expect(await readFile(join(outDir, outputBase, "standalone", "index.html"), "utf-8")).toBe("<html></html>");
  });

  it("treats promote locks older than wall-clock TTL as stale", async () => {
    const root = await makeTempDir();
    const outDir = join(root, "course");
    const stagingDir = join(root, "staging");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(join(stagingDir, "course.yaml"), "title: locked", "utf-8");

    const { __testPromoteFs } = await import("../src/packaging/promote");
    const lockPath = __testPromoteFs.promoteLockPath(outDir);
    await mkdir(dirname(outDir), { recursive: true });
    const staleStarted = Date.now() - 31 * 60 * 1000;
    await writeFile(lockPath, `${process.pid}\n${randomUUID()}\n${staleStarted}\n`, "utf-8");

    await promoteStagingToOutDir(stagingDir, outDir);
    expect(await readFile(join(outDir, "course.yaml"), "utf-8")).toBe("title: locked");
  });
});
