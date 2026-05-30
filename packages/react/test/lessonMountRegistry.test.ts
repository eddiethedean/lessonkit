import { afterEach, describe, expect, it } from "vitest";
import { getLessonMountCount, registerLessonMount, resetLessonMountRegistryForTests } from "../src/runtime/lessonMountRegistry";

describe("lessonMountRegistry", () => {
  afterEach(() => {
    resetLessonMountRegistryForTests();
  });

  it("refcounts duplicate lessonId mounts", () => {
    const a = registerLessonMount("lesson-1");
    expect(getLessonMountCount("lesson-1")).toBe(1);
    registerLessonMount("lesson-1");
    expect(getLessonMountCount("lesson-1")).toBe(2);
    a();
    expect(getLessonMountCount("lesson-1")).toBe(1);
  });
});
