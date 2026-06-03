import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Course, Lesson, TrueFalse } from "../src";
import {
  AssessmentLessonGuard,
  resetAssessmentWarningsForTests,
} from "../src/assessment/AssessmentLessonGuard";

describe("AssessmentLessonGuard", () => {
  afterEach(() => {
    cleanup();
    resetAssessmentWarningsForTests();
    vi.unstubAllEnvs();
    sessionStorage.clear();
  });

  it("throws in development when outside Lesson", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() =>
      render(
        <AssessmentLessonGuard blockLabel="TrueFalse" checkId="tf-1">
          {() => <p>inner</p>}
        </AssessmentLessonGuard>,
      ),
    ).toThrow(/must be wrapped in <Lesson>/);
  });

  it("renders alert in production when outside Lesson", () => {
    vi.stubEnv("NODE_ENV", "production");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <AssessmentLessonGuard blockLabel="TrueFalse" checkId="tf-1">
        {() => <p>inner</p>}
      </AssessmentLessonGuard>,
    );
    expect(screen.getByRole("alert").textContent).toMatch(/must be placed inside a Lesson/i);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("TrueFalse supports retry and show solution", () => {
    render(
      <Course title="T" courseId="course-1" config={{ xapi: { enabled: false } }}>
        <Lesson title="L" lessonId="lesson-1">
          <TrueFalse
            checkId="tf-opts"
            question="2+2=5?"
            answer={false}
            enableRetry
            enableSolutionsButton
          />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByLabelText("True"));
    expect(screen.getByRole("status").textContent).toContain("Try again");
    fireEvent.click(screen.getByRole("button", { name: /Show solution/i }));
    expect(screen.getByText(/Correct answer/i)).toBeTruthy();
    fireEvent.click(screen.getByLabelText("False"));
    expect(screen.getByRole("status").textContent).toContain("Correct");
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
