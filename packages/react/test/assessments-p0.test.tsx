import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { defineAssessmentPlugin } from "@lessonkit/core";
import {
  AssessmentSequence,
  Course,
  DragAndDrop,
  DragTheWords,
  FillInTheBlanks,
  Lesson,
  MarkTheWords,
  TrueFalse,
} from "../src";

const config = { xapi: { enabled: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="Assessments" courseId="assessments-p0" config={config}>
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("1.1.x P0 assessment blocks", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("TrueFalse accepts correct answer", () => {
    render(
      wrap(
        <TrueFalse checkId="tf-1" question="Sky is blue?" answer={true} />,
      ),
    );
    fireEvent.click(screen.getByLabelText("True"));
    expect(screen.getByRole("status").textContent).toContain("Correct");
  });

  it("TrueFalse reports incorrect choice", () => {
    render(
      wrap(
        <TrueFalse checkId="tf-wrong" question="Sky is blue?" answer={true} />,
      ),
    );
    fireEvent.click(screen.getByLabelText("False"));
    expect(screen.getByRole("status").textContent).toContain("Try again");
  });

  it("TrueFalse feedback follows scoreAssessment passed flag", () => {
    const plugin = defineAssessmentPlugin({
      id: "tf-scorer",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => ({ passed: true, score: 1, maxScore: 1 }),
    });
    render(
      <Course title="Assessments" courseId="assessments-p0" config={{ xapi: { enabled: false }, plugins: [plugin] }}>
        <Lesson title="L1" lessonId="lesson-1">
          <TrueFalse checkId="tf-plugin" question="Sky is blue?" answer={true} />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByLabelText("False"));
    expect(screen.getByRole("status").textContent).toContain("Correct");
  });

  it("MarkTheWords marks correct tokens", () => {
    render(
      wrap(
        <MarkTheWords
          checkId="mtw-1"
          text="The capital is Paris"
          correctWords={["Paris"]}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Paris" }));
    expect(screen.getByRole("status").textContent).toContain("Correct");
  });

  it("FillInTheBlanks checks blanks", () => {
    render(
      wrap(
        <FillInTheBlanks checkId="fib-1" template="The *capital* is France." />,
      ),
    );
    fireEvent.change(screen.getByTestId("blank-blank-0"), { target: { value: "capital" } });
    fireEvent.click(screen.getByTestId("check-blanks"));
    expect(screen.getByRole("status").textContent).toContain("Correct");
  });

  it("DragTheWords places words in zones", () => {
    render(
      wrap(
        <DragTheWords
          checkId="dtw-1"
          template="I like *cats*"
          words={["cats", "dogs"]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("word-cats"));
    fireEvent.click(screen.getByTestId("zone-0"));
    fireEvent.click(screen.getByTestId("check-drag-words"));
    expect(screen.getByRole("status").textContent).toContain("Correct");
  });

  it("DragAndDrop with empty targets is not answerable", () => {
    const ref = React.createRef<import("@lessonkit/core").AssessmentHandle>();
    render(
      wrap(
        <DragAndDrop
          ref={ref}
          checkId="dad-empty"
          items={[{ id: "a", label: "Apple" }]}
          targets={[]}
        />,
      ),
    );
    expect(ref.current?.getAnswerGiven()).toBe(false);
    expect((screen.getByTestId("check-drag-drop") as HTMLButtonElement).disabled).toBe(true);
  });

  it("DragAndDrop assigns items to targets", () => {
    render(
      wrap(
        <DragAndDrop
          checkId="dad-1"
          items={[
            { id: "a", label: "Apple" },
            { id: "b", label: "Banana" },
          ]}
          targets={[
            { id: "t1", label: "Fruit A", accepts: "a" },
            { id: "t2", label: "Fruit B", accepts: "b" },
          ]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("drag-item-a"));
    fireEvent.click(screen.getByTestId("drop-t1"));
    fireEvent.click(screen.getByTestId("drag-item-b"));
    fireEvent.click(screen.getByTestId("drop-t2"));
    fireEvent.click(screen.getByTestId("check-drag-drop"));
    expect(screen.getByRole("status").textContent).toContain("Correct");
  });

  it("AssessmentSequence shows sequential steps", () => {
    render(
      wrap(
        <AssessmentSequence>
          <TrueFalse checkId="tf-seq" question="2+2=4?" answer={true} />
          <TrueFalse checkId="tf-seq-2" question="Earth is flat?" answer={false} />
        </AssessmentSequence>,
      ),
    );
    expect(screen.getByText(/Question 1 of 2/)).toBeTruthy();
    fireEvent.click(screen.getByTestId("sequence-next"));
    expect(screen.getByText(/Question 2 of 2/)).toBeTruthy();
    fireEvent.click(screen.getByTestId("sequence-prev"));
    expect(screen.getByText(/Question 1 of 2/)).toBeTruthy();
  });
});
