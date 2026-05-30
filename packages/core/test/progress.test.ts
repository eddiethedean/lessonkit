import { describe, expect, it } from "vitest";
import { createProgressController } from "../src/progress";

describe("createProgressController", () => {
  it("tracks active lesson, completion, and course completion", () => {
    const progress = createProgressController();
    expect(progress.getState().activeLessonId).toBeUndefined();

    progress.setActiveLesson("l1", 0);
    expect(progress.getState().activeLessonId).toBe("l1");

    const first = progress.completeLesson("l1", 100);
    expect(first.didComplete).toBe(true);
    expect(first.durationMs).toBe(100);
    expect(progress.getState().completedLessonIds.has("l1")).toBe(true);

    const duplicate = progress.completeLesson("l1", 200);
    expect(duplicate.didComplete).toBe(false);

    progress.setActiveLesson("l2", 150);
    const course = progress.completeCourse();
    expect(course.didComplete).toBe(true);
    expect(progress.getState().courseCompleted).toBe(true);

    const duplicateCourse = progress.completeCourse();
    expect(duplicateCourse.didComplete).toBe(false);
  });
});
