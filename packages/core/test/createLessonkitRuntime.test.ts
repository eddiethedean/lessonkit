import { describe, expect, it, vi } from "vitest";
import { defineAssessmentPlugin, defineLifecyclePlugin, defineTelemetryPlugin } from "../src/plugins/define";
import { createLessonkitRuntime } from "../src/runtime/createLessonkitRuntime";

describe("createLessonkitRuntime", () => {
  it("tracks lesson lifecycle via injected emit callback", () => {
    const events: string[] = [];
    const runtime = createLessonkitRuntime({ courseId: "c" });

    const emit = (event: { name: string }) => events.push(event.name);

    runtime.setActiveLesson("lesson-1", emit);
    runtime.completeCourse(emit);

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
    runtime.setActiveLesson("lesson-1", (event) => events.push(event.name));
    runtime.completeLesson("lesson-1", (event) => events.push(event.name));
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
    runtime.setActiveLesson("lesson-1", (event) => events.push(event.name));
    runtime.completeLesson("lesson-1", (event) => events.push(event.name));
    const startedBefore = events.filter((e) => e === "lesson_started").length;
    runtime.setActiveLesson("lesson-1", (event) => events.push(event.name));
    expect(events.filter((e) => e === "lesson_started").length).toBe(startedBefore);
  });

  it("setActiveLesson completes previous lesson when switching", () => {
    const events: string[] = [];
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("lesson-1", (event) => events.push(event.name));
    runtime.setActiveLesson("lesson-2", (event) => events.push(event.name));
    expect(events).toContain("lesson_started");
    expect(events.filter((e) => e === "lesson_completed").length).toBe(1);
  });

  it("setActiveLesson skips auto-complete when autoCompleteOnLessonSwitch is false", () => {
    const events: string[] = [];
    const runtime = createLessonkitRuntime({ courseId: "c", autoCompleteOnLessonSwitch: false });
    runtime.setActiveLesson("lesson-1", (event) => events.push(event.name));
    runtime.setActiveLesson("lesson-2", (event) => events.push(event.name));
    expect(events.filter((e) => e === "lesson_completed").length).toBe(0);
    expect(events.filter((e) => e === "lesson_started").length).toBe(2);
  });

  it("resetForCourseChange disposes and re-runs plugin setup", () => {
    const log: string[] = [];
    const plugin = defineLifecyclePlugin({
      id: "lifecycle-reset",
      version: "1",
      kind: "analytics",
      setup: () => {
        log.push("setup");
      },
      dispose: () => {
        log.push("dispose");
      },
    });
    const runtime = createLessonkitRuntime({ courseId: "c", plugins: [plugin] });
    expect(log).toEqual(["setup"]);
    runtime.resetForCourseChange("c2");
    expect(log).toEqual(["setup", "dispose", "setup"]);
    expect(runtime.config.courseId).toBe("c2");
  });

  it("setActiveLesson completes in-progress lesson when navigating to a completed lesson", () => {
    const events: string[] = [];
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("lesson-1", (event) => events.push(event.name));
    runtime.completeLesson("lesson-1", (event) => events.push(event.name));
    runtime.setActiveLesson("lesson-2", (event) => events.push(event.name));
    events.length = 0;
    runtime.setActiveLesson("lesson-1", (event) => events.push(event.name));
    expect(events.filter((e) => e === "lesson_completed").length).toBe(1);
    expect(runtime.getProgressState().completedLessonIds.has("lesson-2")).toBe(true);
  });

  it("updateConfig does not re-init plugins when the same plugins array is passed", () => {
    const setup = vi.fn();
    const dispose = vi.fn();
    const plugin = defineLifecyclePlugin({
      id: "stable-plugins",
      version: "1",
      kind: "analytics",
      setup,
      dispose,
    });
    const plugins = [plugin];
    const runtime = createLessonkitRuntime({ courseId: "c", plugins });
    expect(setup).toHaveBeenCalledTimes(1);
    runtime.updateConfig({ plugins });
    expect(setup).toHaveBeenCalledTimes(1);
    expect(dispose).not.toHaveBeenCalled();
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

  it("updateConfig resets progress when courseId changes", () => {
    const runtime = createLessonkitRuntime({ courseId: "c" });
    runtime.setActiveLesson("lesson-1", () => {});
    runtime.completeLesson("lesson-1", () => {});
    expect(runtime.getProgressState().completedLessonIds.has("lesson-1")).toBe(true);

    runtime.updateConfig({ courseId: "c2" });
    expect(runtime.config.courseId).toBe("c2");
    expect(runtime.getProgressState().completedLessonIds.size).toBe(0);
    expect(runtime.getProgressState().activeLessonId).toBeUndefined();
  });

  it("disposes plugins when updateConfig clears plugins without calling setup again", () => {
    const setup = vi.fn();
    const plugin = defineLifecyclePlugin({
      id: "setup-test",
      version: "1",
      kind: "analytics",
      setup,
    });
    const runtime = createLessonkitRuntime({ courseId: "c", plugins: [plugin] });
    expect(setup).toHaveBeenCalledTimes(1);

    runtime.updateConfig({ plugins: [] });
    expect(setup).toHaveBeenCalledTimes(1);
  });

  it("does not call setupAll on plugin swap when deferPluginSetup is true", () => {
    const setup = vi.fn();
    const pluginA = defineLifecyclePlugin({
      id: "a",
      version: "1",
      kind: "analytics",
      setup,
    });
    const pluginB = defineLifecyclePlugin({
      id: "b",
      version: "1",
      kind: "analytics",
      setup,
    });
    const runtime = createLessonkitRuntime({
      courseId: "c",
      plugins: [pluginA],
      deferPluginSetup: true,
    });
    expect(setup).not.toHaveBeenCalled();
    runtime.updateConfig({ plugins: [pluginB] });
    expect(setup).not.toHaveBeenCalled();
  });

  it("scoreAssessment merges lessonId from the second argument", () => {
    const score = vi.fn(() => ({ score: 1, maxScore: 1, passed: true }));
    const plugin = defineAssessmentPlugin({
      id: "score",
      version: "1",
      kind: "assessment",
      scoreAssessment: score,
    });
    const runtime = createLessonkitRuntime({ courseId: "c", plugins: [plugin] });
    runtime.scoreAssessment({ checkId: "q1", response: "a" }, "lesson-2");
    expect(score).toHaveBeenCalledWith(
      expect.objectContaining({ checkId: "q1", lessonId: "lesson-2" }),
      expect.any(Object),
    );
  });

  it("updateConfig re-runs plugin setup when session.user changes", () => {
    const log: string[] = [];
    const plugin = defineLifecyclePlugin({
      id: "lifecycle-user",
      version: "1",
      kind: "lms",
      setup: () => {
        log.push("setup");
      },
      dispose: () => {
        log.push("dispose");
      },
    });
    const runtime = createLessonkitRuntime({
      courseId: "c",
      session: { user: { id: "user-a" } },
      plugins: [plugin],
    });
    expect(log).toEqual(["setup"]);
    runtime.updateConfig({ session: { user: { id: "user-b" } } });
    expect(log).toEqual(["setup", "dispose", "setup"]);
  });

  it("lifecycle emit runs telemetry plugins exactly once per event", () => {
    let pluginRuns = 0;
    const plugin = defineTelemetryPlugin({
      id: "count",
      version: "1",
      kind: "analytics",
      onTelemetry: (event) => {
        pluginRuns += 1;
        return event;
      },
    });
    const runtime = createLessonkitRuntime({ courseId: "c", plugins: [plugin] });
    runtime.setActiveLesson("lesson-1", () => {});
    expect(pluginRuns).toBe(1);
  });

  it("warns when runtimeVersion is v1 in development", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    createLessonkitRuntime({ courseId: "c", runtimeVersion: "v1" });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('runtimeVersion "v1"'));
    spy.mockRestore();
  });
});
