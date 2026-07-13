/**
 * Contract tests for assessment resume telemetry replay (1.7.3 semantics).
 * Validates observable event payloads — not implementation internals.
 */
import React, { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { AssessmentHandle } from "@lessonkit/core";
import { Course, GuessTheAnswer, ImagePairing, Lesson } from "../src";

const COURSE_ID = "resume-replay-contract";

function wrap(
  children: React.ReactNode,
  capture: (e: { name: string; data?: unknown }) => void,
) {
  return (
    <Course
      title="Resume replay"
      courseId={COURSE_ID}
      config={{
        xapi: { enabled: false },
        tracking: { replayResumeEvents: true, sink: capture },
      }}
    >
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("resume replay contract", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("GuessTheAnswer replays failed terminal telemetry with correct:false", async () => {
    const events: { name: string; data?: unknown }[] = [];
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <GuessTheAnswer
          ref={ref}
          checkId="guess-replay-fail"
          prompt="Capital of France?"
          answer="Paris"
          enableRetry={false}
        />,
        (e) => events.push(e),
      ),
    );
    act(() => {
      ref.current?.resume?.({
        guess: "London",
        checked: true,
        passed: false,
        revealed: true,
        completed: true,
      });
    });
    await waitFor(() => {
      const answered = events.find((e) => e.name === "assessment_answered");
      expect(answered?.data).toMatchObject({
        correct: false,
        response: "London",
      });
      const completed = events.find((e) => e.name === "assessment_completed");
      expect(completed?.data).toMatchObject({ score: 0, maxScore: 1 });
    });
  });

  it("ImagePairing replays failed terminal telemetry when enableRetry is false", async () => {
    const events: { name: string; data?: unknown }[] = [];
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <ImagePairing
          ref={ref}
          checkId="pair-replay-fail"
          enableRetry={false}
          pairs={[
            { id: "p1", label: "Helmet", imageSrc: "/helmet.png" },
            { id: "p2", label: "Gloves", imageSrc: "/gloves.png" },
          ]}
        />,
        (e) => events.push(e),
      ),
    );
    act(() => {
      ref.current?.resume?.({
        matched: [],
        submitted: true,
        passed: false,
        completed: true,
      });
    });
    await waitFor(() => {
      const answered = events.find((e) => e.name === "assessment_answered");
      expect(answered?.data).toMatchObject({ correct: false });
      const completed = events.find((e) => e.name === "assessment_completed");
      expect(completed?.data).toMatchObject({ score: 0, maxScore: 2 });
    });
  });

  it("GuessTheAnswer does not replay telemetry when replayResumeEvents is disabled", async () => {
    const events: { name: string; data?: unknown }[] = [];
    const ref = createRef<AssessmentHandle>();
    render(
      <Course
        title="Resume replay"
        courseId={COURSE_ID}
        config={{
          xapi: { enabled: false },
          tracking: { replayResumeEvents: false, sink: (e) => events.push(e) },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <GuessTheAnswer
            ref={ref}
            checkId="guess-no-replay"
            prompt="2+2?"
            answer="4"
            enableRetry={false}
          />
        </Lesson>
      </Course>,
    );
    act(() => {
      ref.current?.resume?.({
        guess: "3",
        checked: true,
        passed: false,
        completed: true,
      });
    });
    await waitFor(() => {
      expect((screen.getByTestId("guess-input") as HTMLInputElement).value).toBe("3");
    });
    expect(events.some((e) => e.name === "assessment_answered")).toBe(false);
    expect(events.some((e) => e.name === "assessment_completed")).toBe(false);
  });
});
