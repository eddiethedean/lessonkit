import React, { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { AssessmentHandle } from "@lessonkit/core";
import {
  Course,
  GuessTheAnswer,
  Lesson,
  MultimediaChoice,
  Quiz,
  SingleChoiceSet,
  SortParagraphs,
} from "../src";

const config = { xapi: { enabled: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="1.7 assessments" courseId="blocks-17" config={config}>
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("1.7.0 Tier B P1 assessment blocks", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("SortParagraphs scores correct order", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <SortParagraphs
          ref={ref}
          checkId="sort-1"
          paragraphs={["First", "Second", "Third"]}
          correctOrder={[0, 1, 2]}
        />,
      ),
    );
    const section = screen.getByRole("region", { name: "Sort the Paragraphs" });
    fireEvent.click(within(section).getByRole("button", { name: "Check" }));
    expect(within(section).getByText("Correct")).toBeTruthy();
    expect(ref.current?.getScore()).toBe(3);
    expect(ref.current?.getXAPIData()?.interactionType).toBe("sortParagraphs");
  });

  it("SortParagraphs blocks re-check after failed terminal resume when enableRetry is false", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <SortParagraphs
          ref={ref}
          checkId="sort-terminal"
          paragraphs={["A", "B"]}
          correctOrder={[1, 0]}
          enableRetry={false}
        />,
      ),
    );
    act(() => {
      ref.current?.resume?.({
        order: [0, 1],
        checked: true,
        passed: false,
        completed: true,
      });
    });
    const section = screen.getByRole("region", { name: "Sort the Paragraphs" });
    expect(
      within(section).getByRole("button", { name: "Check" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("SortParagraphs replays failed terminal telemetry when replayResumeEvents is enabled", async () => {
    const events: { name: string; data?: unknown }[] = [];
    const ref = createRef<AssessmentHandle>();
    render(
      <Course
        title="1.7 assessments"
        courseId="blocks-17"
        config={{
          xapi: { enabled: false },
          tracking: { replayResumeEvents: true, sink: (e) => { events.push(e); } },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <SortParagraphs
            ref={ref}
            checkId="sort-replay-fail"
            paragraphs={["A", "B"]}
            correctOrder={[1, 0]}
            enableRetry={false}
          />
        </Lesson>
      </Course>,
    );
    act(() => {
      ref.current?.resume?.({
        order: [0, 1],
        checked: true,
        passed: false,
        completed: true,
      });
    });
    await waitFor(() => {
      const answered = events.find((e) => e.name === "assessment_answered");
      expect(answered?.data).toMatchObject({ correct: false });
      expect(events.some((e) => e.name === "assessment_completed")).toBe(true);
    });
  });

  it("SortParagraphs reorders with Up/Down and resumes state", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <SortParagraphs
          ref={ref}
          checkId="sort-resume"
          paragraphs={["A", "B"]}
          correctOrder={[1, 0]}
        />,
      ),
    );
    const section = screen.getByRole("region", { name: "Sort the Paragraphs" });
    fireEvent.click(within(section).getByRole("button", { name: /Move paragraph 1 down/i }));
    act(() => {
      ref.current?.resume?.({ order: [1, 0], checked: true, passed: true });
    });
    expect(ref.current?.getScore()).toBe(2);
  });

  it("GuessTheAnswer scored mode accepts fuzzy match", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <GuessTheAnswer
          ref={ref}
          checkId="guess-1"
          prompt="Capital of France?"
          answer="Paris"
        />,
      ),
    );
    const section = screen.getByRole("region", { name: "Guess the Answer" });
    fireEvent.change(within(section).getByLabelText(/your guess/i), {
      target: { value: "  paris  " },
    });
    fireEvent.click(within(section).getByRole("button", { name: "Check" }));
    expect(within(section).getByText("Correct")).toBeTruthy();
    expect(ref.current?.getXAPIData()?.interactionType).toBe("guessTheAnswer");
  });

  it("GuessTheAnswer unscored mode reveals without checkId", () => {
    render(
      wrap(
        <GuessTheAnswer scored={false} prompt="Reveal demo" answer="Hidden answer" />,
      ),
    );
    const section = screen.getByRole("region", { name: "Guess the Answer" });
    fireEvent.click(within(section).getByRole("button", { name: "Reveal answer" }));
    expect(within(section).getByText(/Hidden answer/)).toBeTruthy();
  });

  it("MultimediaChoice selects correct media option", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <MultimediaChoice
          ref={ref}
          checkId="mm-1"
          question="Pick the safe channel"
          choices={[
            {
              label: "Portal",
              mediaUrl: "/portal.png",
              mediaKind: "image",
              altText: "IT portal icon",
            },
            {
              label: "Email",
              mediaUrl: "/email.png",
              mediaKind: "image",
              altText: "Email icon",
            },
          ]}
          answer="Portal"
        />,
      ),
    );
    const section = screen.getByRole("region", { name: "Multimedia Choice" });
    fireEvent.click(within(section).getByLabelText("Portal"));
    expect(within(section).getByText("Correct")).toBeTruthy();
    expect(ref.current?.getXAPIData()?.interactionType).toBe("mcq");
  });

  it("SingleChoiceSet gates Next until Quiz answered", () => {
    render(
      wrap(
        <SingleChoiceSet blockId="scs-1" title="MCQ set">
          <Quiz checkId="scs-q1" question="One?" choices={["A", "B"]} answer="A" />
          <Quiz checkId="scs-q2" question="Two?" choices={["C", "D"]} answer="D" />
        </SingleChoiceSet>,
      ),
    );
    const nav = screen.getByRole("navigation", { name: "Single choice set navigation" });
    const next = within(nav).getByRole("button", { name: "Next" }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("A"));
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    expect(screen.getByText("Question 2 of 2")).toBeTruthy();
  });
});
