import React, { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { defineAssessmentPlugin } from "@lessonkit/core";
import type { AssessmentHandle, TelemetryEvent } from "@lessonkit/core";
import {
  Course,
  DragAndDrop,
  DragTheWords,
  FillInTheBlanks,
  FindHotspot,
  ImagePairing,
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

  it("MarkTheWords partial selection does not meet passingScore", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <MarkTheWords
          ref={ref}
          checkId="mtw-wrong"
          text="Paris is in France"
          correctWords={["Paris", "France"]}
          passingScore={2}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Paris" }));
    expect(ref.current?.getScore()).toBe(1);
    expect(ref.current?.getMaxScore()).toBe(2);
    expect(ref.current?.getXAPIData()?.correct).toBe(false);
  });

  it("MarkTheWords with enableRetry=false completes on submit when below passingScore", async () => {
    const events: TelemetryEvent[] = [];
    render(
      <Course
        title="Assessments"
        courseId="assessments-p0"
        config={{
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <MarkTheWords
            checkId="mtw-no-retry"
            text="Paris is in France"
            correctWords={["Paris", "France"]}
            passingScore={2}
            enableRetry={false}
          />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Paris" }));
    fireEvent.click(screen.getByTestId("mark-the-words-submit"));
    await waitFor(() =>
      expect(
        events.some(
          (e) =>
            e.name === "assessment_completed" &&
            e.data?.checkId === "mtw-no-retry" &&
            e.data?.score === 1,
        ),
      ).toBe(true),
    );
  });

  it("ImagePairing with enableRetry=false completes on submit when below passingScore", async () => {
    const events: TelemetryEvent[] = [];
    render(
      <Course
        title="Assessments"
        courseId="assessments-p0"
        config={{
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <ImagePairing
            checkId="ip-no-retry"
            enableRetry={false}
            passingScore={2}
            pairs={[
              { id: "a", label: "A", imageSrc: "/a.png" },
              { id: "b", label: "B", imageSrc: "/b.png" },
            ]}
          />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByTestId("pairing-card-a-0"));
    fireEvent.click(screen.getByTestId("pairing-card-a-1"));
    fireEvent.click(screen.getByTestId("image-pairing-finish"));
    await waitFor(() =>
      expect(
        events.some(
          (e) =>
            e.name === "assessment_completed" &&
            e.data?.checkId === "ip-no-retry" &&
            e.data?.score === 1 &&
            e.data?.maxScore === 2,
        ),
      ).toBe(true),
    );
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

  it("FillInTheBlanks reports wrong blank value", () => {
    render(
      wrap(
        <FillInTheBlanks checkId="fib-wrong" template="The *capital* is France." />,
      ),
    );
    fireEvent.change(screen.getByTestId("blank-blank-0"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByTestId("check-blanks"));
    expect(screen.getByRole("status").textContent).toContain("Try again");
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

  it("DragTheWords reports wrong zone placement", () => {
    render(
      wrap(
        <DragTheWords
          checkId="dtw-wrong"
          template="I like *cats*"
          words={["cats", "dogs"]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("word-dogs"));
    fireEvent.click(screen.getByTestId("zone-0"));
    fireEvent.click(screen.getByTestId("check-drag-words"));
    expect(screen.getByRole("status").textContent).toContain("Try again");
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

  it("DragAndDrop reports incorrect assignment when all targets are filled", () => {
    render(
      wrap(
        <DragAndDrop
          checkId="dad-wrong"
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
    fireEvent.click(screen.getByTestId("drag-item-b"));
    fireEvent.click(screen.getByTestId("drop-t1"));
    fireEvent.click(screen.getByTestId("drag-item-a"));
    fireEvent.click(screen.getByTestId("drop-t2"));
    fireEvent.click(screen.getByTestId("check-drag-drop"));
    expect(screen.getByRole("status").textContent).toContain("Try again");
  });

  it("FindHotspot defaults passingScore to 1 when prop is omitted", async () => {
    const events: TelemetryEvent[] = [];
    render(
      <Course
        title="Course"
        courseId="course-1"
        config={{
          tracking: { sink: (e) => void events.push(e) },
          xapi: { enabled: false },
        }}
      >
        <Lesson title="Lesson" lessonId="lesson-1">
          <FindHotspot
            checkId="hs-1"
            src="/img.png"
            alt="Map"
            targets={[{ id: "t1", label: "Target", x: 10, y: 10 }]}
            correctTargetId="t1"
          />
        </Lesson>
      </Course>,
    );

    fireEvent.click(screen.getByTestId("target-t1"));
    fireEvent.click(screen.getByTestId("check-hotspot"));
    await waitFor(() =>
      expect(
        events.some(
          (e) =>
            e.name === "assessment_completed" &&
            e.data?.checkId === "hs-1" &&
            e.data?.passingScore === 1,
        ),
      ).toBe(true),
    );
  });

  it("FindHotspot reports incorrect target click", () => {
    render(
      wrap(
        <FindHotspot
          checkId="hs-wrong"
          src="/img.png"
          alt="Map"
          targets={[
            { id: "t1", label: "Target A", x: 10, y: 10 },
            { id: "t2", label: "Target B", x: 50, y: 50 },
          ]}
          correctTargetId="t1"
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("target-t2"));
    fireEvent.click(screen.getByTestId("check-hotspot"));
    expect(screen.getByRole("status").textContent).toContain("Try again");
  });

});
