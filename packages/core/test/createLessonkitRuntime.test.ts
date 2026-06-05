import { describe, expect, it, vi } from "vitest";
import { defineTelemetryPlugin } from "../src/plugins/define";
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

  it("resetForCourseChange clears progress and updates config.courseId", () => {
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("lesson-1", () => {});
    runtime.resetForCourseChange("c2");
    expect(runtime.getProgressState().activeLessonId).toBeUndefined();
    expect(runtime.config.courseId).toBe("c2");
  });

  it("updateConfig syncs session fields for getSession", () => {
    const runtime = createLessonkitRuntime({ courseId: "c", session: { sessionId: "s1" } });
    runtime.updateConfig({ session: { sessionId: "s2", attemptId: "a1", user: { id: "u1" } } });
    expect(runtime.getSession()).toEqual({
      sessionId: "s2",
      attemptId: "a1",
      user: { id: "u1" },
    });
  });

  it("updateConfig updates courseId and runtimeVersion on config snapshot", () => {
    const runtime = createLessonkitRuntime({ courseId: "c", runtimeVersion: "v2" });
    runtime.updateConfig({ courseId: "c2", runtimeVersion: "v1" });
    expect(runtime.config.courseId).toBe("c2");
    expect(runtime.config.runtimeVersion).toBe("v1");
  });

  it("progress getter reflects controller replacement after resetForCourseChange", () => {
    const runtime = createLessonkitRuntime({ courseId: "c" });
    const initialProgress = runtime.progress;
    runtime.setActiveLesson("lesson-1", () => {});
    runtime.resetForCourseChange("c2");
    expect(runtime.progress).not.toBe(initialProgress);
    expect(runtime.getProgressState().activeLessonId).toBeUndefined();
  });

  it("completeLesson emits via callback", () => {
    const events: string[] = [];
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("lesson-1", (name) => events.push(name));
    runtime.completeLesson("lesson-1", (name) => events.push(name));
    expect(events.filter((e) => e === "lesson_completed").length).toBeGreaterThan(0);
  });

  it("track emits built events", () => {
    const runtime = createLessonkitRuntime({ courseId: "c" });
    const names: string[] = [];
    runtime.track("course_started", undefined, (event) => {
      if (event) names.push(event.name);
    });
    expect(names).toEqual(["course_started"]);
  });

  it("track skips invalid events", () => {
    const runtime = createLessonkitRuntime({ courseId: "c" });
    const emitted: unknown[] = [];
    runtime.track("quiz_answered", { checkId: "q", question: "Q", choice: "A", correct: false }, (e) =>
      emitted.push(e),
    );
    expect(emitted).toHaveLength(0);
  });

  it("setActiveLesson does not re-emit lesson_started for a completed lesson", () => {
    const events: string[] = [];
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("lesson-1", (name) => events.push(name));
    runtime.completeLesson("lesson-1", (name) => events.push(name));
    const startedBefore = events.filter((e) => e === "lesson_started").length;
    runtime.setActiveLesson("lesson-1", (name) => events.push(name));
    expect(events.filter((e) => e === "lesson_started").length).toBe(startedBefore);
  });

  it("setActiveLesson completes previous lesson when switching", () => {
    const events: string[] = [];
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("lesson-1", (name) => events.push(name));
    runtime.setActiveLesson("lesson-2", (name) => events.push(name));
    expect(events).toContain("lesson_started");
    expect(events.filter((e) => e === "lesson_completed").length).toBe(1);
  });

  it("track runs telemetry plugins before deliver", () => {
    const plugin = defineTelemetryPlugin({
      id: "filter",
      version: "1",
      kind: "analytics",
      onTelemetry: (event) => (event.name === "course_started" ? null : event),
    });
    const runtime = createLessonkitRuntime({ courseId: "c", plugins: [plugin] });
    const names: string[] = [];
    runtime.track("course_started", undefined, (e) => names.push(e.name));
    runtime.track("course_completed", undefined, (e) => names.push(e.name));
    expect(names).toEqual(["course_completed"]);
    expect(runtime.pluginHost?.plugins).toHaveLength(1);
  });

  it("warns when runtimeVersion is v1 in development", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    createLessonkitRuntime({ courseId: "c", runtimeVersion: "v1" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('runtimeVersion "v1"'));
    spy.mockRestore();
  });
});
