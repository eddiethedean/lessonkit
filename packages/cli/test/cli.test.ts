import { describe, expect, it, vi } from "vitest";
import { createProgram, run } from "../src";

describe("@lessonkit/cli", () => {
  it("createProgram wires basic metadata", () => {
    const program = createProgram({ log: () => {} });
    expect(program.name()).toBe("lessonkit");
    expect(program.description()).toBe("LessonKit CLI");
  });

  it("runs init/dev/build/package/publish stubs", async () => {
    const log = vi.fn();

    await run(["node", "lessonkit", "init"], { log });
    expect(log).toHaveBeenLastCalledWith("lessonkit init (coming soon)");

    await run(["node", "lessonkit", "dev"], { log });
    expect(log).toHaveBeenLastCalledWith("lessonkit dev (coming soon)");

    await run(["node", "lessonkit", "build"], { log });
    expect(log).toHaveBeenLastCalledWith("lessonkit build (coming soon)");

    await run(["node", "lessonkit", "package"], { log });
    expect(log).toHaveBeenLastCalledWith("lessonkit package (coming soon)");

    await run(["node", "lessonkit", "publish"], { log });
    expect(log).toHaveBeenLastCalledWith("lessonkit publish (coming soon)");
  });
});

