import React, { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { defineAssessmentPlugin, type AssessmentHandle } from "@lessonkit/core";
import {
  Course,
  DragAndDrop,
  DragTheWords,
  Essay,
  FillInTheBlanks,
  KnowledgeCheck,
  Lesson,
  MarkTheWords,
  Quiz,
  Summary,
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

  it("Quiz getScore and getXAPIData agree when resumed passed without selected", async () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <Quiz
          ref={ref}
          checkId="quiz-split"
          question="Pick one"
          choices={["A", "B"]}
          answer="B"
        />,
      ),
    );
    act(() => {
      ref.current?.resume?.({ quizPassed: true, selected: null, selectionCorrect: null });
    });
    await waitFor(() => {
      expect(ref.current?.getScore()).toBe(1);
      expect(ref.current?.getXAPIData()).toEqual(
        expect.objectContaining({ score: 1, maxScore: 1, interactionType: "mcq" }),
      );
    });
  });

  it("Quiz round-trips plugin custom scores through resume", async () => {
    const plugin = defineAssessmentPlugin({
      id: "quiz-resume-scorer",
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
            checkId="quiz-resume"
            question="Pick one"
            choices={["A", "B"]}
            answer="B"
          />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByLabelText("B"));
    const saved = ref.current?.getCurrentState?.();
    expect(saved).toEqual(
      expect.objectContaining({ quizPassed: true, completedScore: 4, completedMaxScore: 4 }),
    );

    cleanup();
    sessionStorage.clear();

    const ref2 = createRef<AssessmentHandle>();
    render(
      <Course
        title="Handles"
        courseId="handle-course"
        config={{ xapi: { enabled: false }, plugins: [plugin] }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <Quiz
            ref={ref2}
            checkId="quiz-resume"
            question="Pick one"
            choices={["A", "B"]}
            answer="B"
          />
        </Lesson>
      </Course>,
    );
    act(() => {
      ref2.current?.resume?.(saved!);
    });
    await waitFor(() => {
      expect(ref2.current?.getScore()).toBe(4);
      expect(ref2.current?.getXAPIData()).toEqual(
        expect.objectContaining({ score: 4, maxScore: 4 }),
      );
    });
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

  it("MarkTheWords shows status when passingScore threshold is met", () => {
    render(
      wrap(
        <MarkTheWords
          checkId="mtw-partial"
          text="one two three"
          correctWords={["two", "three"]}
          passingScore={1}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "two" }));
    expect(screen.getByRole("status").textContent).toContain("Correct");
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

  it("FillInTheBlanks falls back when blanks length mismatches template", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      wrap(
        <FillInTheBlanks
          checkId="fib-mismatch"
          template="The *capital* of France is *Paris*."
          blanks={[{ id: "only-one", answer: "capital" }]}
        />,
      ),
    );
    expect(screen.getByTestId("blank-blank-0")).toBeTruthy();
    expect(screen.getByTestId("blank-blank-1")).toBeTruthy();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("FillInTheBlanks renders custom blank ids from blanks prop", () => {
    render(
      wrap(
        <FillInTheBlanks
          checkId="fib-custom"
          template="The *capital* of France is *Paris*."
          blanks={[
            { id: "city-blank", answer: "capital" },
            { id: "name-blank", answer: "Paris" },
          ]}
        />,
      ),
    );
    expect(screen.getByTestId("blank-city-blank")).toBeTruthy();
    expect(screen.getByTestId("blank-name-blank")).toBeTruthy();
    fireEvent.change(screen.getByTestId("blank-city-blank"), { target: { value: "capital" } });
    fireEvent.change(screen.getByTestId("blank-name-blank"), { target: { value: "Paris" } });
    fireEvent.click(screen.getByTestId("check-blanks"));
    expect(screen.getByRole("status").textContent).toContain("Correct");
  });

  it("Summary getScore reflects live selection before check", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <Summary
          ref={ref}
          checkId="summary-live"
          statements={["First", "Second", "Noise"]}
          correct={["First", "Second"]}
        />,
      ),
    );
    expect(ref.current?.getScore()).toBe(0);
    fireEvent.click(screen.getByTestId("summary-statement-0"));
    fireEvent.click(screen.getByTestId("summary-statement-1"));
    expect(ref.current?.getScore()).toBe(2);
  });

  it("Summary resume does not mark passed without check", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <Summary
          ref={ref}
          checkId="summary-resume"
          statements={["First", "Second", "Noise"]}
          correct={["First", "Second"]}
        />,
      ),
    );
    act(() => {
      ref.current?.resume?.({
        selectedIndices: [0, 1],
        passed: false,
        checked: false,
      });
    });
    expect(ref.current?.getScore()).toBe(2);
    expect((screen.getByTestId("summary-check") as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByTestId("summary-feedback")).toBeNull();
  });

  it("Quiz allows retry after a correct answer when enableRetry is true", () => {
    render(
      wrap(
        <Quiz
          checkId="quiz-retry"
          question="Pick one"
          choices={["A", "B"]}
          answer="B"
          enableRetry
        />,
      ),
    );
    fireEvent.click(screen.getByLabelText("B"));
    expect(screen.getByRole("status").textContent).toContain("Correct");
    fireEvent.click(screen.getByTestId("quiz-retry"));
    fireEvent.click(screen.getByLabelText("A"));
    expect(screen.getByRole("status").textContent).toContain("Try again");
    expect((screen.getByLabelText("B") as HTMLInputElement).disabled).toBe(false);
  });

  it("FillInTheBlanks completes on failure when enableRetry is false", async () => {
    const events: { name: string }[] = [];
    render(
      <Course
        title="Handles"
        courseId="handle-course"
        config={{
          xapi: { enabled: false },
          tracking: { sink: (e) => { events.push(e); } },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <FillInTheBlanks
            checkId="fib-no-retry"
            template="The *right* answer"
            enableRetry={false}
          />
        </Lesson>
      </Course>,
    );
    fireEvent.change(screen.getByTestId("blank-blank-0"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByTestId("check-blanks"));
    await waitFor(() => {
      expect(events.some((e) => e.name === "assessment_completed")).toBe(true);
    });
  });

  it("DragTheWords completes on failure when enableRetry is false", async () => {
    const events: { name: string }[] = [];
    render(
      <Course
        title="Handles"
        courseId="handle-course"
        config={{
          xapi: { enabled: false },
          tracking: { sink: (e) => { events.push(e); } },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <DragTheWords
            checkId="dtw-no-retry"
            template="Pick *right*"
            words={["right", "wrong"]}
            enableRetry={false}
          />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByTestId("word-wrong"));
    fireEvent.click(screen.getByTestId("zone-0"));
    fireEvent.click(screen.getByTestId("check-drag-words"));
    await waitFor(() => {
      expect(events.some((e) => e.name === "assessment_completed")).toBe(true);
    });
  });

  it("Quiz completes on wrong answer when enableRetry is false", async () => {
    const events: { name: string }[] = [];
    render(
      <Course
        title="Handles"
        courseId="handle-course"
        config={{
          xapi: { enabled: false },
          tracking: { sink: (e) => { events.push(e); } },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <Quiz
            checkId="quiz-no-retry"
            question="Pick one"
            choices={["A", "B"]}
            answer="B"
            enableRetry={false}
          />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByLabelText("A"));
    await waitFor(() => {
      expect(events.some((e) => e.name === "quiz_completed")).toBe(true);
    });
  });

  it("KnowledgeCheck forwards enableRetry like Quiz", async () => {
    const events: { name: string }[] = [];
    render(
      <Course
        title="Handles"
        courseId="handle-course"
        config={{
          xapi: { enabled: false },
          tracking: { sink: (e) => { events.push(e); } },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <KnowledgeCheck
            checkId="kc-no-retry"
            question="Pick one"
            choices={["A", "B"]}
            answer="B"
            enableRetry={false}
          />
        </Lesson>
      </Course>,
    );
    fireEvent.click(screen.getByLabelText("A"));
    await waitFor(() => {
      expect(events.some((e) => e.name === "quiz_completed")).toBe(true);
    });
  });

  it("Quiz resume replay uses scores from saved state", async () => {
    const events: { name: string; data?: unknown }[] = [];
    const ref = createRef<AssessmentHandle>();
    render(
      <Course
        title="Handles"
        courseId="handle-course"
        config={{
          xapi: { enabled: false },
          tracking: { replayResumeEvents: true, sink: (e) => { events.push(e); } },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <Quiz
            ref={ref}
            checkId="quiz-replay-scores"
            question="Pick one"
            choices={["A", "B"]}
            answer="B"
          />
        </Lesson>
      </Course>,
    );
    act(() => {
      ref.current?.resume?.({
        quizPassed: true,
        selected: "B",
        selectionCorrect: true,
        completedScore: 4,
        completedMaxScore: 4,
      });
    });
    await waitFor(() => {
      const completed = events.find((e) => e.name === "quiz_completed");
      expect(completed?.data).toMatchObject({ score: 4, maxScore: 4 });
    });
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

  it("DragAndDrop resume normalizes corrupt pool and assignments", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <DragAndDrop
          ref={ref}
          checkId="dad-resume"
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
    act(() => {
      expect(ref.current?.resume).toBeDefined();
      ref.current!.resume!({
        assignments: { t1: "a", t2: "a", unknown: "z" },
        pool: ["a", "b", "b", "ghost"],
        passed: false,
        checked: false,
      });
    });
    expect(screen.queryByTestId("drag-item-a")).toBeNull();
    expect(screen.getByTestId("drag-item-b")).toBeTruthy();
    expect(ref.current!.getCurrentState!().pool).toEqual(["b"]);
  });

  it("Essay resume clears submitted when text is below minLength", () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(<Essay ref={ref} checkId="essay-resume" question="Describe." minLength={10} />),
    );
    act(() => {
      expect(ref.current?.resume).toBeDefined();
      ref.current!.resume!({ text: "short", submitted: true });
    });
    expect(ref.current!.getCurrentState!().submitted).toBe(false);
    expect(screen.queryByTestId("essay-submitted")).toBeNull();
  });
});
