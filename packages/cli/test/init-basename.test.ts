import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const pathMocks = vi.hoisted(() => ({
  basename: vi.fn<(path: string) => string>(),
}));

vi.mock("node:path", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:path")>();
  return {
    ...actual,
    basename: (path: string, ext?: string) => {
      const mocked = pathMocks.basename(path);
      if (mocked !== undefined) return mocked;
      return actual.basename(path, ext);
    },
  };
});

describe("init --here basename fallback", () => {
  let parentDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    parentDir = await mkdtemp(join(tmpdir(), "lk-cli-basename-"));
    pathMocks.basename.mockReturnValue("");
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(parentDir, { recursive: true, force: true });
    pathMocks.basename.mockReset();
  });

  it("slugifies to my-course when basename is empty", async () => {
    vi.resetModules();
    const { runInit } = await import("../src/commands/init.js");
    const here = join(parentDir, "here");
    await mkdir(here, { recursive: true });
    process.chdir(here);
    const result = await runInit({ here: true, skipInstall: true }, { log: () => {}, error: () => {} });
    expect(result.ok).toBe(true);
    const lessonkit = JSON.parse(await readFile(join(here, "lessonkit.json"), "utf8"));
    expect(lessonkit.course.courseId).toBe("my-course");
  });
});
