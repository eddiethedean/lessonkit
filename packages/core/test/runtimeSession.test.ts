import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createLessonkitRuntime,
  hasCourseStarted,
  tryEmitCourseStarted,
  type StoragePort,
} from "../src";
import { resetCourseStartedEmitFlightForTests } from "../src/runtime/courseLifecycle";

function createMapStorage(): StoragePort {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
      return true;
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  };
}

describe("runtime session integration", () => {
  afterEach(() => {
    resetCourseStartedEmitFlightForTests();
    vi.restoreAllMocks();
  });

  it("tryEmitCourseStarted marks session storage once per session and course", async () => {
    const storage = createMapStorage();
    const emit = vi.fn(() => true);
    const ctx = {
      courseId: "course-1" as const,
      sessionId: "session-1",
      storage,
      pluginHost: null,
      lxpackBridge: "off" as const,
    };

    const first = await tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, false);
    const second = await tryEmitCourseStarted(ctx, { emitCourseStartedEvent: emit }, true);

    expect(first.emitted).toBe(true);
    expect(first.marked).toBe(true);
    expect(second.emitted).toBe(true);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(hasCourseStarted(storage, "session-1", "course-1")).toBe(true);
  });

  it("createLessonkitRuntime resolves a stable session id through storage port", () => {
    const storage = createMapStorage();
    const runtime = createLessonkitRuntime(
      { courseId: "course-1", session: { sessionId: "learner-a" } },
      { storage },
    );

    expect(runtime.getSession().sessionId).toBe("learner-a");
  });
});
