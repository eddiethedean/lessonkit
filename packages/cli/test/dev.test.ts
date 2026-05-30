import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as exec from "../src/lib/exec.js";
import { runDev } from "../src/commands/dev.js";

describe("runDev", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-cli-dev-"));
    await writeFile(
      join(dir, "lessonkit.json"),
      JSON.stringify({
        schemaVersion: 1,
        name: "demo",
        course: {
          courseId: "demo",
          title: "Demo",
          layout: "single-spa",
          lessons: [{ id: "l1", title: "L1" }],
        },
      }),
      "utf8",
    );
    await writeFile(join(dir, "package.json"), JSON.stringify({ devDependencies: { vite: "^7" } }), "utf8");
    await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
    await writeFile(join(dir, "node_modules", "vite", "bin", "vite.js"), "", "utf8");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("invokes vite dev server", async () => {
    const runCommand = vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);

    const result = await runDev({ cwd: dir, json: true });

    expect(result.ok).toBe(true);
    expect(result).toMatchObject({ command: "dev", projectRoot: dir });
    expect(runCommand).toHaveBeenCalledWith(
      process.execPath,
      [join(dir, "node_modules", "vite", "bin", "vite.js")],
      expect.objectContaining({ cwd: dir }),
    );
  });

  it("launches vite via node on win32", async () => {
    const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("win32");
    const runCommand = vi.spyOn(exec, "runCommand").mockResolvedValue(undefined);

    const result = await runDev({ cwd: dir, json: true });

    expect(result.ok).toBe(true);
    expect(runCommand).toHaveBeenCalledWith(
      process.execPath,
      [join(dir, "node_modules", "vite", "bin", "vite.js")],
      expect.objectContaining({ cwd: dir }),
    );
    platformSpy.mockRestore();
  });
});
