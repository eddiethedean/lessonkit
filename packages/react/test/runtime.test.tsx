import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Course, Lesson, LessonkitProvider, Quiz, useLessonkit } from "../src";
import type { TelemetryEvent } from "@lessonkit/core";

describe("@lessonkit/react runtime", () => {
  it("tracks quiz_answered with expected payload", async () => {
    const events: TelemetryEvent[] = [];

    const { getByLabelText } = render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: {
            sink: (e: TelemetryEvent) => {
              events.push(e);
            },
          },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <Quiz question="Q" choices={["A", "B"]} answer="B" />
        </Lesson>
      </Course>,
    );

    // Select A (incorrect)
    fireEvent.click(getByLabelText("A"));

    await waitFor(() => {
      expect(events.some((e) => e.name === "quiz_answered")).toBe(true);
    });

    const quizAnswered = events.find((e) => e.name === "quiz_answered");
    expect(quizAnswered).toBeDefined();
    if (!quizAnswered) throw new Error("missing quiz_answered");
    expect(quizAnswered.data).toMatchObject({ question: "Q", choice: "A", correct: false });
    expect(quizAnswered.courseId).toBe("course-1");
    expect(quizAnswered.lessonId).toBe("lesson-1");
    expect(typeof quizAnswered.sessionId).toBe("string");
  });

  it("tracks lesson lifecycle and emits duration on completion", async () => {
    let now = 0;
    const dateNow = vi.spyOn(Date, "now").mockImplementation(() => now);

    const events: TelemetryEvent[] = [];
    const sink = (e: TelemetryEvent) => {
      events.push(e);
    };

    let complete!: (lessonId: string) => void;

    function Driver() {
      const runtime = useLessonkit();
      React.useEffect(() => {
        runtime.setActiveLesson("lesson-1");
        complete = runtime.completeLesson;
      }, [runtime]);
      return <div>driver</div>;
    }

    render(
      <LessonkitProvider config={{ courseId: "course-1", tracking: { sink } }}>
        <Driver />
      </LessonkitProvider>,
    );

    await waitFor(() => {
      expect(events.some((e) => e.name === "lesson_started")).toBe(true);
    });

    now = 5000;
    complete("lesson-1");

    const completed = events.find((e) => e.name === "lesson_completed");
    expect(completed).toBeDefined();
    if (!completed) throw new Error("missing lesson_completed");
    expect(completed.lessonId).toBe("lesson-1");
    expect(completed.data).toMatchObject({ lessonId: "lesson-1", durationMs: 5000 });

    const tot = events.find((e) => e.name === "lesson_time_on_task");
    expect(tot).toBeDefined();
    if (!tot) throw new Error("missing lesson_time_on_task");
    expect(tot.data).toMatchObject({ lessonId: "lesson-1", durationMs: 5000 });

    dateNow.mockRestore();
  });
});

