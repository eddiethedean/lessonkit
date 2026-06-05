import React, { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { defineAssessmentPlugin, type AssessmentHandle } from "@lessonkit/core";
import {
  Course,
  DragAndDrop,
  DragTheWords,
  FillInTheBlanks,
  Lesson,
  MarkTheWords,
  Quiz,
  TrueFalse,
} from "../src";

const config = { xapi: { enabled: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="Handles" courseId="handle-course" config={config}>
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("AssessmentHandle (imperative API)", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("TrueFalse exposes score and reset via ref", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <TrueFalse ref={ref} checkId="tf-ref" question="True?" answer={true} enableSolutionsButton />,
      ),
    );
    expect(ref.current?.getAnswerGiven()).toBe(false);
    expect(ref.current?.getScore()).toBe(0);
    ref.current?.showSolutions();
    fireEvent.click(screen.getByLabelText("True"));
    expect(ref.current?.getAnswerGiven()).toBe(true);
    expect(ref.current?.getScore()).toBe(1);
    expect(ref.current?.getXAPIData()?.interactionType).toBe("trueFalse");
    expect(typeof ref.current?.resetTask).toBe("function");
  });

  it("TrueFalse getXAPIData reflects plugin custom scores", () => {
    const plugin = defineAssessmentPlugin({
      id: "tf-xapi-scorer",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ passed: true, score: 4, maxScore: 4 }),
    });
    const ref = createRef<AssessmentHandle>();
    render(
      <Course
        title="Handles"
        courseId="handle-course"
        config={{ xapi: { enabled: false }, plugins: [plugin] }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <TrueFalse ref={ref} checkId="tf-xapi" question="True?" answer={true} />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByLabelText("True"));
    expect(ref.current?.getXAPIData()).toEqual(
      expect.objectContaining({ score: 4, maxScore: 4 }),
    );
  });

  it("Quiz getXAPIData reflects plugin custom scores", () => {
    const plugin = defineAssessmentPlugin({
      id: "quiz-xapi-scorer",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ passed: true, score: 4, maxScore: 4 }),
    });
    const ref = createRef<AssessmentHandle>();
    render(
      <Course
        title="Handles"
        courseId="handle-course"
        config={{ xapi: { enabled: false }, plugins: [plugin] }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <Quiz
            ref={ref}
            checkId="quiz-xapi"
            question="Pick one"
            choices={["A", "B"]}
            answer="B"
          />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByLabelText("B"));
    expect(ref.current?.getXAPIData()).toEqual(
      expect.objectContaining({ score: 4, maxScore: 4, interactionType: "mcq" }),
    );
  });

  it("MarkTheWords handle reflects selection state", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <MarkTheWords
          ref={ref}
          checkId="mtw-ref"
          text="one two"
          correctWords={["two"]}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "two" }));
    expect(ref.current?.getScore()).toBe(1);
    expect(ref.current?.getMaxScore()).toBe(1);
    expect(typeof ref.current?.resetTask).toBe("function");
  });

  it("FillInTheBlanks handle tracks blank input", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <FillInTheBlanks ref={ref} checkId="fib-ref" template="Say *hi*." />,
      ),
    );
    fireEvent.change(screen.getByTestId("blank-blank-0"), { target: { value: "hi" } });
    fireEvent.click(screen.getByTestId("check-blanks"));
    expect(ref.current?.getScore()).toBe(1);
    ref.current?.showSolutions();
    expect(screen.getByTestId("check-blanks")).toBeTruthy();
  });

  it("DragTheWords and DragAndDrop handles report completion", () => {
    const dtwRef = createRef<AssessmentHandle>();
    render(
      wrap(
        <DragTheWords
          ref={dtwRef}
          checkId="dtw-ref"
          template="Pick *a*"
          words={["a", "b"]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("word-a"));
    fireEvent.click(screen.getByTestId("zone-0"));
    fireEvent.click(screen.getByTestId("check-drag-words"));
    expect(dtwRef.current?.getAnswerGiven()).toBe(true);

    cleanup();
    sessionStorage.clear();

    const dadRef = createRef<AssessmentHandle>();
    render(
      wrap(
        <DragAndDrop
          ref={dadRef}
          checkId="dad-ref"
          items={[{ id: "x", label: "X" }]}
          targets={[{ id: "t1", label: "T1", accepts: "x" }]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("drag-item-x"));
    fireEvent.click(screen.getByTestId("drop-t1"));
    fireEvent.click(screen.getByTestId("check-drag-drop"));
    expect(dadRef.current?.getScore()).toBe(1);
  });
});
