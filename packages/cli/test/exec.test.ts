import { describe, expect, it, vi } from "vitest";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { CliError } from "../src/lib/errors.js";
import { runCommand } from "../src/lib/exec.js";

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

const mockedSpawn = vi.mocked(spawn);

describe("runCommand", () => {
  it("resolves when child exits 0", async () => {
    const child = new EventEmitter() as EventEmitter & { on: EventEmitter["on"] };
    mockedSpawn.mockReturnValue(child as never);

    const promise = runCommand("/bin/vite", ["build"], { cwd: "/tmp" });
    child.emit("close", 0);
    await expect(promise).resolves.toBeUndefined();
  });

  it("rejects when child exits non-zero", async () => {
    const child = new EventEmitter() as EventEmitter & { on: EventEmitter["on"] };
    mockedSpawn.mockReturnValue(child as never);

    const promise = runCommand("/bin/vite", ["build"], { cwd: "/tmp" });
    child.emit("close", 1);
    await expect(promise).rejects.toBeInstanceOf(CliError);
  });

  it("rejects on spawn error", async () => {
    const child = new EventEmitter() as EventEmitter & {
      on: EventEmitter["on"];
      emit: EventEmitter["emit"];
    };
    mockedSpawn.mockReturnValue(child as never);

    const promise = runCommand("/bin/missing", [], { cwd: "/tmp" });
    child.emit("error", new Error("ENOENT"));
    await expect(promise).rejects.toMatchObject({ code: "RUNTIME" });
  });
});
