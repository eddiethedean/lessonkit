import React, { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    fireEvent.click(screen.getByTestId("sort-paragraphs-check"));
    expect(screen.getByTestId("sort-paragraphs-feedback").textContent).toContain("Correct");
    expect(ref.current?.getScore()).toBe(3);
    expect(ref.current?.getXAPIData()?.interactionType).toBe("sortParagraphs");
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
    fireEvent.click(screen.getByTestId("sort-down-0"));
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
    fireEvent.change(screen.getByTestId("guess-input"), { target: { value: "  paris  " } });
    fireEvent.click(screen.getByTestId("guess-check"));
    expect(screen.getByTestId("guess-feedback").textContent).toContain("Correct");
    expect(ref.current?.getXAPIData()?.interactionType).toBe("guessTheAnswer");
  });

  it("GuessTheAnswer unscored mode reveals without checkId", () => {
    render(
      wrap(
        <GuessTheAnswer scored={false} prompt="Reveal demo" answer="Hidden answer" />,
      ),
    );
    fireEvent.click(screen.getByTestId("guess-reveal-unscored"));
    expect(screen.getByTestId("guess-answer-reveal-unscored").textContent).toContain("Hidden answer");
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
    fireEvent.click(screen.getByLabelText("Portal"));
    expect(screen.getByTestId("multimedia-choice-feedback").textContent).toContain("Correct");
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
    const next = screen.getByTestId("single-choice-set-next") as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("A"));
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    expect(screen.getByText("Question 2 of 2")).toBeTruthy();
  });
});
