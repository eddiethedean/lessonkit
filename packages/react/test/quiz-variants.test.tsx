import React, { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AssessmentHandle } from "@lessonkit/core";
import { shuffleChoiceIndices } from "@lessonkit/core";
import {
  AssessmentSequence,
  Course,
  Lesson,
  Quiz,
  SingleChoiceSet,
} from "../src";

const config = { xapi: { enabled: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="Quiz variants" courseId="quiz-variants" config={config}>
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("Quiz variants (1.7.0)", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("single-select unchanged when variant props omitted", () => {
    render(
      wrap(
        <Quiz checkId="single" question="Pick?" choices={["A", "B"]} answer="B" />,
      ),
    );
    fireEvent.click(screen.getByLabelText("B"));
    expect(screen.getByTestId("quiz-feedback").textContent).toContain("Correct");
  });

  it("multi-select requires Check and scores exact set", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <Quiz
          ref={ref}
          checkId="multi"
          question="Select all hazards"
          choices={["Phishing", "Portal", "USB drop"]}
          answer="Phishing"
          answers={["Phishing", "USB drop"]}
        />,
      ),
    );
    expect(ref.current?.getAnswerGiven()).toBe(false);
    fireEvent.click(screen.getByLabelText("Phishing"));
    fireEvent.click(screen.getByLabelText("USB drop"));
    expect(ref.current?.getAnswerGiven()).toBe(false);
    fireEvent.click(screen.getByTestId("quiz-check"));
    expect(ref.current?.getAnswerGiven()).toBe(true);
    expect(ref.current?.getScore()).toBe(2);
    expect(ref.current?.getXAPIData()?.response).toEqual(["Phishing", "USB drop"]);
  });

  it("multi-select fails when extra wrong choice selected", () => {
    render(
      wrap(
        <Quiz
          checkId="multi-wrong"
          question="Select hazards"
          choices={["Phishing", "Portal", "USB drop"]}
          answer="Phishing"
          answers={["Phishing", "USB drop"]}
        />,
      ),
    );
    fireEvent.click(screen.getByLabelText("Phishing"));
    fireEvent.click(screen.getByLabelText("USB drop"));
    fireEvent.click(screen.getByLabelText("Portal"));
    fireEvent.click(screen.getByTestId("quiz-check"));
    expect(screen.getByTestId("quiz-feedback").textContent).toContain("Try again");
  });

  it("shuffleChoices renders permuted order", () => {
    render(
      wrap(
        <Quiz
          checkId="shuffled"
          question="Order?"
          choices={["One", "Two", "Three", "Four"]}
          answer="One"
          shuffleChoices
          shuffleSeed="fixed-seed"
        />,
      ),
    );
    const order = shuffleChoiceIndices(4, "fixed-seed");
    const labels = order.map((i) => ["One", "Two", "Three", "Four"][i]);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual(labels);
  });

  it("choiceFeedback announces on selection", () => {
    render(
      wrap(
        <Quiz
          checkId="feedback"
          question="Pick"
          choices={["Safe", "Risky"]}
          answer="Safe"
          choiceFeedback={{ Risky: "Unknown links are high risk." }}
        />,
      ),
    );
    fireEvent.click(screen.getByLabelText("Risky"));
    expect(screen.getByTestId("quiz-choice-feedback").textContent).toContain("high risk");
  });

  it("resume restores multi-select checked state", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <Quiz
          ref={ref}
          checkId="multi-resume"
          question="Select"
          choices={["A", "B", "C"]}
          answer="A"
          answers={["A", "B"]}
        />,
      ),
    );
    act(() => {
      ref.current?.resume?.({
        selected: ["A", "B"],
        checked: true,
        quizPassed: true,
        completedScore: 2,
        completedMaxScore: 2,
      });
    });
    expect(ref.current?.getScore()).toBe(2);
  });

  it("AssessmentSequence gates Next until multi-select Check", () => {
    render(
      wrap(
        <AssessmentSequence sequential blockId="seq-multi">
          <Quiz
            checkId="seq-multi-q"
            question="Select all"
            choices={["A", "B"]}
            answer="A"
            answers={["A", "B"]}
          />
          <Quiz checkId="seq-after" question="Next?" choices={["X", "Y"]} answer="X" />
        </AssessmentSequence>,
      ),
    );
    const next = screen.getByTestId("sequence-next") as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("A"));
    fireEvent.click(screen.getByLabelText("B"));
    expect(next.disabled).toBe(true);
    fireEvent.click(screen.getByTestId("quiz-check"));
    expect(next.disabled).toBe(false);
  });

  it("SingleChoiceSet gates Next until multi-select Check", () => {
    render(
      wrap(
        <SingleChoiceSet blockId="scs-multi">
          <Quiz
            checkId="scs-multi-q"
            question="Select all"
            choices={["A", "B"]}
            answer="A"
            answers={["A", "B"]}
          />
        </SingleChoiceSet>,
      ),
    );
    const next = screen.getByTestId("single-choice-set-next") as HTMLButtonElement;
    fireEvent.click(screen.getByLabelText("A"));
    fireEvent.click(screen.getByLabelText("B"));
    expect(next.disabled).toBe(true);
    fireEvent.click(screen.getByTestId("quiz-check"));
    expect(next.disabled).toBe(true);
  });
});
