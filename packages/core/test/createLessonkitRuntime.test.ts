import { describe, expect, it } from "vitest";
import { createLessonkitRuntime } from "../src/runtime/createLessonkitRuntime";

describe("createLessonkitRuntime", () => {
  it("tracks lesson lifecycle via injected emit callback", () => {
    const events: string[] = [];
    const runtime = createLessonkitRuntime({ courseId: "c" });

    const emit = (name: string) => events.push(name);

    runtime.setActiveLesson("lesson-1", (name) => emit(name));
    runtime.completeCourse((name) => emit(name));

    expect(events).toContain("lesson_started");
    expect(events).toContain("lesson_completed");
    expect(events).toContain("course_completed");
    expect(runtime.getProgressState().courseCompleted).toBe(true);
  });

  it("resetForCourseChange clears progress", () => {
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("lesson-1", () => {});
    runtime.resetForCourseChange("c2");
    expect(runtime.getProgressState().activeLessonId).toBeUndefined();
  });
});
