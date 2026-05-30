import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveViteJs } from "../src/lib/project.js";
import { CliError } from "../src/lib/errors.js";

describe("resolveViteJs", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lk-cli-vite-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("finds vite.js under project node_modules", async () => {
    const viteJs = join(dir, "node_modules", "vite", "bin", "vite.js");
    await mkdir(join(dir, "node_modules", "vite", "bin"), { recursive: true });
    await writeFile(viteJs, "", "utf8");

    expect(resolveViteJs(dir)).toBe(viteJs);
  });

  it("throws when vite.js is missing", () => {
    expect(() => resolveViteJs(dir)).toThrow(CliError);
  });
});
