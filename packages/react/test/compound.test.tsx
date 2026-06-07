import React, { createRef } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CompoundHandle } from "@lessonkit/core";
import { compoundStateStorageKey, createCompoundResumeState, saveCompoundState } from "@lessonkit/core";
import { createSessionStoragePort } from "@lessonkit/core";
import { IV_META_KEY } from "../src/compound/useCompoundVideoShell";
import { useBranchingScenarioOptional } from "../src/compound/useBranchingScenario";
import {
  AssessmentSequence,
  Course,
  DragTheWords,
  FillInTheBlanks,
  FindHotspot,
  InteractiveBook,
  Lesson,
  Page,
  Quiz,
  Slide,
  SlideDeck,
  InteractiveVideo,
  TimedCue,
  Text,
  TrueFalse,
  BranchingScenario,
  BranchNode,
  BranchChoice,
  Scenario,
} from "../src";

const COURSE_ID = "compound-course";

function wrap(children: React.ReactNode, persistCompoundState = false) {
  return (
    <Course
      title="Compound"
      courseId={COURSE_ID}
      config={{ xapi: { enabled: false }, session: { persistCompoundState } }}
    >
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("InteractiveBook", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("navigates between pages", () => {
    render(
      wrap(
        <InteractiveBook blockId="book-1" title="Book">
          <Page blockId="p1" title="One">
            <Text>Page one</Text>
          </Page>
          <Page blockId="p2" title="Two">
            <Text>Page two</Text>
          </Page>
        </InteractiveBook>,
      ),
    );
    expect(screen.getByText("Page one")).toBeTruthy();
    fireEvent.click(screen.getByTestId("book-next"));
    expect(screen.getByText("Page two")).toBeTruthy();
  });

  it("exposes compound handle scores from child assessments", () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <InteractiveBook blockId="book-2" title="Book" ref={ref}>
          <Page blockId="p1" title="Quiz page">
            <TrueFalse checkId="tf-1" question="True?" answer={true} />
          </Page>
        </InteractiveBook>,
      ),
    );
    fireEvent.click(screen.getByLabelText("True"));
    expect(ref.current?.getAnswerGiven()).toBe(true);
    expect(ref.current?.getScore()).toBe(1);
  });

  it("aggregates scores across hidden pages with showBookScore", () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <InteractiveBook blockId="book-3" title="Book" showBookScore ref={ref}>
          <Page blockId="p1" title="Intro">
            <Text>Intro</Text>
          </Page>
          <Page blockId="p2" title="Quiz">
            <TrueFalse checkId="tf-2" question="2+2=4?" answer={true} />
          </Page>
        </InteractiveBook>,
      ),
    );
    fireEvent.click(screen.getByTestId("book-next"));
    fireEvent.click(screen.getByLabelText("True"));
    fireEvent.click(screen.getByTestId("book-prev"));
    expect(screen.getByTestId("book-score").textContent).toContain("Score: 1");
    expect(ref.current?.getScore()).toBe(1);
    expect(ref.current?.getMaxScore()).toBe(1);
  });

  it("restores activePageIndex from sessionStorage when persistCompoundState is true", () => {
    const storage = createSessionStoragePort();
    saveCompoundState(
      storage,
      COURSE_ID,
      "book-persist",
      createCompoundResumeState({ activePageIndex: 1 }),
    );

    render(
      wrap(
        <InteractiveBook blockId="book-persist" title="Book">
          <Page blockId="p1" title="One">
            <Text>Page one</Text>
          </Page>
          <Page blockId="p2" title="Two">
            <Text>Page two</Text>
          </Page>
        </InteractiveBook>,
        true,
      ),
    );
    expect(screen.getByText("Page two")).toBeTruthy();
    expect(screen.getByText("Page 2 of 2")).toBeTruthy();
  });

  it("persists activePageIndex to sessionStorage on navigation", () => {
    render(
      wrap(
        <InteractiveBook blockId="book-save" title="Book">
          <Page blockId="p1" title="One">
            <Text>Page one</Text>
          </Page>
          <Page blockId="p2" title="Two">
            <Text>Page two</Text>
          </Page>
        </InteractiveBook>,
        true,
      ),
    );
    fireEvent.click(screen.getByTestId("book-next"));
    const raw = sessionStorage.getItem(compoundStateStorageKey(COURSE_ID, "book-save"));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { activePageIndex: number };
    expect(parsed.activePageIndex).toBe(1);
  });

  it("does not wipe childStates from sessionStorage on mount", () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "book-child",
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: { "hs-1": { selected: "t1", checked: true } },
      }),
    );

    render(
      wrap(
        <InteractiveBook blockId="book-child" title="Book">
          <Page blockId="p1" title="Hotspot">
            <FindHotspot
              checkId="hs-1"
              src="/img.png"
              alt="Map"
              targets={[{ id: "t1", label: "A", x: 10, y: 10 }]}
              correctTargetId="t1"
            />
          </Page>
        </InteractiveBook>,
        true,
      ),
    );

    const raw = sessionStorage.getItem(compoundStateStorageKey(COURSE_ID, "book-child"));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { childStates: Record<string, { selected?: string; checked?: boolean }> };
    expect(parsed.childStates["hs-1"]?.selected).toBe("t1");
    expect(parsed.childStates["hs-1"]?.checked).toBe(true);
  });

  it("round-trips FillInTheBlanks child state through sessionStorage", () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "book-fill",
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: {
          "fib-1": {
            values: { "blank-0": "Paris" },
            passed: false,
            submitted: true,
            showSolutions: false,
          },
        },
      }),
    );

    render(
      wrap(
        <InteractiveBook blockId="book-fill" title="Book">
          <Page blockId="p1" title="Blanks">
            <FillInTheBlanks checkId="fib-1" template="Capital is *Paris*." />
          </Page>
        </InteractiveBook>,
        true,
      ),
    );

    expect(screen.getByDisplayValue("Paris")).toBeTruthy();
    const raw = sessionStorage.getItem(compoundStateStorageKey(COURSE_ID, "book-fill"));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as {
      childStates: Record<string, { values?: Record<string, string> }>;
    };
    expect(parsed.childStates["fib-1"]?.values?.["blank-0"]).toBe("Paris");
  });

  it("round-trips DragTheWords child state through sessionStorage", () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "book-drag",
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: {
          "dtw-1": {
            zones: { "zone-0": "cats" },
            pool: ["dogs"],
            passed: false,
            submitted: false,
            keyboardWord: null,
          },
        },
      }),
    );

    render(
      wrap(
        <InteractiveBook blockId="book-drag" title="Book">
          <Page blockId="p1" title="Drag">
            <DragTheWords
              checkId="dtw-1"
              template="I like *cats*."
              words={["cats", "dogs"]}
            />
          </Page>
        </InteractiveBook>,
        true,
      ),
    );

    expect(screen.getByTestId("zone-0").textContent).toContain("cats");
    const raw = sessionStorage.getItem(compoundStateStorageKey(COURSE_ID, "book-drag"));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as {
      childStates: Record<string, { zones?: Record<string, string> }>;
    };
    expect(parsed.childStates["dtw-1"]?.zones?.["zone-0"]).toBe("cats");
  });

  it("persists page index when saved childStates have no registered handles", async () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "book-orphan",
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: { "removed-quiz": { selected: "a" } },
      }),
    );

    render(
      wrap(
        <InteractiveBook blockId="book-orphan" title="Book">
          <Page blockId="p1" title="One">
            <Text>Page one</Text>
          </Page>
          <Page blockId="p2" title="Two">
            <Text>Page two</Text>
          </Page>
        </InteractiveBook>,
        true,
      ),
    );

    fireEvent.click(screen.getByTestId("book-next"));
    await waitFor(() => {
      const raw = sessionStorage.getItem(compoundStateStorageKey(COURSE_ID, "book-orphan"));
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!) as { activePageIndex: number };
      expect(parsed.activePageIndex).toBe(1);
    });
  });

  it("imperative resume hydrates child states after handles mount", async () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <InteractiveBook blockId="book-imperative" title="Book" ref={ref}>
          <Page blockId="p1" title="Quiz page">
            <TrueFalse checkId="tf-imperative" question="True?" answer={true} />
          </Page>
        </InteractiveBook>,
        true,
      ),
    );

    ref.current?.resume(
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: {
          "tf-imperative": { selected: true, selectionCorrect: true, passed: true, showSolutions: false },
        },
      }),
    );

    await waitFor(() => {
      expect((screen.getByLabelText("True") as HTMLInputElement).checked).toBe(true);
    });
  });

  it("clamps corrupt activePageIndex from sessionStorage", () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "book-clamp",
      createCompoundResumeState({ activePageIndex: 99 }),
    );

    render(
      wrap(
        <InteractiveBook blockId="book-clamp" title="Book">
          <Page blockId="p1" title="One">
            <Text>Only page</Text>
          </Page>
        </InteractiveBook>,
        true,
      ),
    );

    expect(screen.getByText("Only page")).toBeTruthy();
    expect(screen.getByText("Page 1 of 1")).toBeTruthy();
  });

  it("restores TrueFalse UI without replaying telemetry after sessionStorage resume", async () => {
    const events: Array<{ name: string; data?: unknown }> = [];
    const captureEvent = (e: { name: string; data?: unknown }) => {
      events.push(e);
    };
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "book-tel",
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: {
          "tf-tel": {
            selected: true,
            selectionCorrect: true,
            passed: true,
            showSolutions: false,
            completedScore: 1,
            completedMaxScore: 1,
          },
        },
      }),
    );

    render(
      <Course
        title="Compound"
        courseId={COURSE_ID}
        config={{
          xapi: { enabled: false },
          session: { persistCompoundState: true },
          tracking: { sink: captureEvent },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <InteractiveBook blockId="book-tel" title="Book">
            <Page blockId="p1" title="Quiz">
              <TrueFalse checkId="tf-tel" question="True?" answer={true} />
            </Page>
          </InteractiveBook>
        </Lesson>
      </Course>,
    );

    await waitFor(() => {
      const trueRadio = screen.getByRole("radio", { name: "True" }) as HTMLInputElement;
      expect(trueRadio.checked).toBe(true);
    });

    expect(events.some((e) => e.name === "assessment_answered")).toBe(false);
    expect(events.some((e) => e.name === "assessment_completed")).toBe(false);
  });

  it("replays assessment telemetry when replayResumeEvents is enabled", async () => {
    const events: Array<{ name: string; data?: unknown }> = [];
    const captureEvent = (e: { name: string; data?: unknown }) => {
      events.push(e);
    };
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "book-tel-replay",
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: {
          "tf-tel-replay": {
            selected: true,
            selectionCorrect: true,
            passed: true,
            showSolutions: false,
            completedScore: 1,
            completedMaxScore: 1,
          },
        },
      }),
    );

    render(
      <Course
        title="Compound"
        courseId={COURSE_ID}
        config={{
          xapi: { enabled: false },
          session: { persistCompoundState: true },
          tracking: { sink: captureEvent, replayResumeEvents: true },
        }}
      >
        <Lesson title="L1" lessonId="lesson-1">
          <InteractiveBook blockId="book-tel-replay" title="Book">
            <Page blockId="p1" title="Quiz">
              <TrueFalse checkId="tf-tel-replay" question="True?" answer={true} />
            </Page>
          </InteractiveBook>
        </Lesson>
      </Course>,
    );

    await waitFor(() => {
      expect(events.some((e) => e.name === "assessment_answered")).toBe(true);
      expect(events.some((e) => e.name === "assessment_completed")).toBe(true);
    });
  });

  it("restores TrueFalse answer state from sessionStorage", async () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "book-tf",
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: {
          "tf-resume": { selected: true, selectionCorrect: true, passed: true, showSolutions: false },
        },
      }),
    );

    render(
      wrap(
        <InteractiveBook blockId="book-tf" title="Book">
          <Page blockId="p1" title="Quiz">
            <TrueFalse checkId="tf-resume" question="True?" answer={true} />
          </Page>
        </InteractiveBook>,
        true,
      ),
    );

    await waitFor(() => {
      expect((screen.getByLabelText("True") as HTMLInputElement).checked).toBe(true);
    });
  });

  it("uses persistCompoundState true by default", () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "book-default",
      createCompoundResumeState({ activePageIndex: 1 }),
    );

    render(
      <Course title="Compound" courseId={COURSE_ID} config={{ xapi: { enabled: false } }}>
        <Lesson title="L1" lessonId="lesson-1">
          <InteractiveBook blockId="book-default" title="Book">
            <Page blockId="p1" title="One">
              <Text>Page one</Text>
            </Page>
            <Page blockId="p2" title="Two">
              <Text>Page two</Text>
            </Page>
          </InteractiveBook>
        </Lesson>
      </Course>,
    );

    expect(screen.getByText("Page two")).toBeTruthy();
  });
});

describe("SlideDeck", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("navigates between slides", () => {
    render(
      wrap(
        <SlideDeck blockId="deck-1" title="Training">
          <Slide blockId="s1" title="One">
            <Text>Slide one</Text>
          </Slide>
          <Slide blockId="s2" title="Two">
            <Text>Slide two</Text>
          </Slide>
        </SlideDeck>,
      ),
    );
    expect(screen.getByText("Slide one")).toBeTruthy();
    fireEvent.click(screen.getByTestId("slide-next"));
    expect(screen.getByText("Slide two")).toBeTruthy();
  });

  it("navigates with keyboard arrow keys", () => {
    render(
      wrap(
        <SlideDeck blockId="deck-kb" title="Training">
          <Slide blockId="s1" title="One">
            <Text>Slide one</Text>
          </Slide>
          <Slide blockId="s2" title="Two">
            <Text>Slide two</Text>
          </Slide>
        </SlideDeck>,
      ),
    );
    const deck = screen.getByTestId("slide-deck");
    deck.focus();
    fireEvent.keyDown(deck, { key: "ArrowRight" });
    expect(screen.getByText("Slide two")).toBeTruthy();
    fireEvent.keyDown(deck, { key: "ArrowLeft" });
    expect(screen.getByText("Slide one")).toBeTruthy();
  });

  it("jumps to first and last slide with Home and End", () => {
    render(
      wrap(
        <SlideDeck blockId="deck-jump" title="Training">
          <Slide blockId="s1" title="One">
            <Text>Slide one</Text>
          </Slide>
          <Slide blockId="s2" title="Two">
            <Text>Slide two</Text>
          </Slide>
          <Slide blockId="s3" title="Three">
            <Text>Slide three</Text>
          </Slide>
        </SlideDeck>,
      ),
    );
    const deck = screen.getByTestId("slide-deck");
    deck.focus();
    fireEvent.keyDown(deck, { key: "End" });
    expect(screen.getByText("Slide three")).toBeTruthy();
    fireEvent.keyDown(deck, { key: "Home" });
    expect(screen.getByText("Slide one")).toBeTruthy();
  });

  it("exposes compound handle scores from child assessments", () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <SlideDeck blockId="deck-2" title="Training" ref={ref}>
          <Slide blockId="s1" title="Quiz slide">
            <TrueFalse checkId="tf-deck-1" question="True?" answer={true} />
          </Slide>
        </SlideDeck>,
      ),
    );
    fireEvent.click(screen.getByLabelText("True"));
    expect(ref.current?.getAnswerGiven()).toBe(true);
    expect(ref.current?.getScore()).toBe(1);
  });

  it("aggregates scores across hidden slides with showDeckScore", () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <SlideDeck blockId="deck-3" title="Training" showDeckScore ref={ref}>
          <Slide blockId="s1" title="Intro">
            <Text>Intro</Text>
          </Slide>
          <Slide blockId="s2" title="Quiz">
            <TrueFalse checkId="tf-deck-2" question="2+2=4?" answer={true} />
          </Slide>
        </SlideDeck>,
      ),
    );
    fireEvent.click(screen.getByTestId("slide-next"));
    fireEvent.click(screen.getByLabelText("True"));
    fireEvent.click(screen.getByTestId("slide-prev"));
    expect(screen.getByTestId("deck-score").textContent).toContain("Score: 1");
    expect(ref.current?.getScore()).toBe(1);
    expect(ref.current?.getMaxScore()).toBe(1);
  });

  it("BUG-R03: persists child state after handle registration completes", async () => {
    render(
      wrap(
        <SlideDeck blockId="deck-r03" title="Training">
          <Slide blockId="s1" title="Intro">
            <Text>Intro</Text>
          </Slide>
          <Slide blockId="s2" title="Quiz">
            <TrueFalse checkId="tf-r03" question="True?" answer={true} />
          </Slide>
        </SlideDeck>,
        true,
      ),
    );
    fireEvent.click(screen.getByTestId("slide-next"));
    fireEvent.click(screen.getByLabelText("True"));

    await waitFor(() => {
      const raw = sessionStorage.getItem(compoundStateStorageKey(COURSE_ID, "deck-r03"));
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!) as {
        childStates: Record<string, { selected?: boolean; passed?: boolean }>;
      };
      expect(parsed.childStates["tf-r03"]?.selected).toBe(true);
      expect(parsed.childStates["tf-r03"]?.passed).toBe(true);
    });
  });

  it("restores activePageIndex from sessionStorage when persistCompoundState is true", () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "deck-persist",
      createCompoundResumeState({ activePageIndex: 1 }),
    );

    render(
      wrap(
        <SlideDeck blockId="deck-persist" title="Training">
          <Slide blockId="s1" title="One">
            <Text>Slide one</Text>
          </Slide>
          <Slide blockId="s2" title="Two">
            <Text>Slide two</Text>
          </Slide>
        </SlideDeck>,
        true,
      ),
    );
    expect(screen.getByText("Slide two")).toBeTruthy();
    expect(screen.getByText("Slide 2 of 2")).toBeTruthy();
  });

  it("persists activePageIndex to sessionStorage on navigation", () => {
    render(
      wrap(
        <SlideDeck blockId="deck-save" title="Training">
          <Slide blockId="s1" title="One">
            <Text>Slide one</Text>
          </Slide>
          <Slide blockId="s2" title="Two">
            <Text>Slide two</Text>
          </Slide>
        </SlideDeck>,
        true,
      ),
    );
    fireEvent.click(screen.getByTestId("slide-next"));
    const raw = sessionStorage.getItem(compoundStateStorageKey(COURSE_ID, "deck-save"));
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { activePageIndex: number };
    expect(parsed.activePageIndex).toBe(1);
  });

  it("restores TrueFalse answer state from sessionStorage", async () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "deck-tf",
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: {
          "tf-deck-resume": { selected: true, selectionCorrect: true, passed: true, showSolutions: false },
        },
      }),
    );

    render(
      wrap(
        <SlideDeck blockId="deck-tf" title="Training">
          <Slide blockId="s1" title="Quiz">
            <TrueFalse checkId="tf-deck-resume" question="True?" answer={true} />
          </Slide>
        </SlideDeck>,
        true,
      ),
    );

    await waitFor(() => {
      expect((screen.getByLabelText("True") as HTMLInputElement).checked).toBe(true);
    });
  });
});

describe("AssessmentSequence compound handle", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("aggregates scores across children when sequential is false", () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <AssessmentSequence ref={ref} sequential={false}>
          <TrueFalse checkId="tf-a" question="A?" answer={true} />
          <TrueFalse checkId="tf-b" question="B?" answer={false} />
        </AssessmentSequence>,
      ),
    );
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios.find((el) => el.closest("[data-lk-check-id='tf-a']"))!);
    fireEvent.click(
      radios.find(
        (el) =>
          el.closest("[data-lk-check-id='tf-b']") &&
          (el as HTMLInputElement).labels?.[0]?.textContent === "False",
      )!,
    );
    expect(ref.current?.getMaxScore()).toBe(2);
    expect(ref.current?.getScore()).toBe(2);
  });

  it("aggregates Quiz scores when sequential is false", () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <AssessmentSequence ref={ref} sequential={false}>
          <Quiz
            checkId="quiz-a"
            question="Pick A"
            choices={["A", "B"]}
            answer="A"
          />
        </AssessmentSequence>,
      ),
    );
    fireEvent.click(screen.getByLabelText("A"));
    expect(ref.current?.getScore()).toBe(1);
    expect(ref.current?.getMaxScore()).toBe(1);
  });

  it("navigates sequential steps", () => {
    render(
      wrap(
        <AssessmentSequence sequential>
          <TrueFalse checkId="tf-s1" question="One?" answer={true} />
          <TrueFalse checkId="tf-s2" question="Two?" answer={false} />
        </AssessmentSequence>,
      ),
    );
    expect(screen.getByText("Question 1 of 2")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("radio", { name: "True" })[0]!);
    fireEvent.click(screen.getByTestId("sequence-next"));
    expect(screen.getByText("Question 2 of 2")).toBeTruthy();
  });

  it("disables Next until the active assessment is answered", () => {
    render(
      wrap(
        <AssessmentSequence sequential>
          <TrueFalse checkId="tf-gate-1" question="One?" answer={true} />
          <TrueFalse checkId="tf-gate-2" question="Two?" answer={false} />
        </AssessmentSequence>,
      ),
    );
    const next = screen.getByTestId("sequence-next") as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    fireEvent.click(screen.getAllByRole("radio", { name: "True" })[0]!);
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    expect(screen.getByText("Question 2 of 2")).toBeTruthy();
  });

  it("requires blockId when persistCompoundState is enabled", () => {
    expect(() =>
      render(
        wrap(
          <AssessmentSequence sequential>
            <TrueFalse checkId="tf-persist-a" question="A?" answer={true} />
          </AssessmentSequence>,
          true,
        ),
      ),
    ).toThrow(/requires a unique blockId/);
  });

  it("uses distinct storage keys for AssessmentSequence instances with unique blockIds", () => {
    render(
      wrap(
        <>
          <AssessmentSequence blockId="seq-auto-a" sequential>
            <TrueFalse checkId="tf-auto-a" question="A?" answer={true} />
            <TrueFalse checkId="tf-auto-b" question="B?" answer={false} />
          </AssessmentSequence>
          <AssessmentSequence blockId="seq-auto-b" sequential>
            <TrueFalse checkId="tf-auto-c" question="C?" answer={true} />
            <TrueFalse checkId="tf-auto-d" question="D?" answer={false} />
          </AssessmentSequence>
        </>,
        true,
      ),
    );
    const nextButtons = screen.getAllByTestId("sequence-next");
    fireEvent.click(screen.getAllByRole("radio", { name: "True" })[0]!);
    fireEvent.click(nextButtons[0]!);
    fireEvent.click(screen.getAllByRole("radio", { name: "True" })[1]!);
    fireEvent.click(nextButtons[1]!);
    const keys = Object.keys(sessionStorage).filter((k) =>
      k.startsWith(`lessonkit:compound:${COURSE_ID}:`),
    );
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(compoundStateStorageKey(COURSE_ID, "assessment-sequence"));
    expect(keys[1]).not.toBe(compoundStateStorageKey(COURSE_ID, "assessment-sequence"));
    expect(new Set(keys).size).toBe(2);
  });

  it("allows Next without an answer when requireAnswerBeforeNext is false", () => {
    render(
      wrap(
        <AssessmentSequence sequential requireAnswerBeforeNext={false}>
          <TrueFalse checkId="tf-skip-1" question="One?" answer={true} />
          <TrueFalse checkId="tf-skip-2" question="Two?" answer={false} />
        </AssessmentSequence>,
      ),
    );
    const next = screen.getByTestId("sequence-next") as HTMLButtonElement;
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    expect(screen.getByText("Question 2 of 2")).toBeTruthy();
  });
});

describe("InteractiveVideo", () => {
  beforeAll(() => {
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("renders video player and timed cue overlay on timeupdate", () => {
    render(
      wrap(
        <InteractiveVideo blockId="iv-1" title="Briefing" src="/sample.mp4">
          <TimedCue atSeconds={1} label="Check">
            <TrueFalse checkId="iv-tf" question="Ready?" answer={true} />
          </TimedCue>
        </InteractiveVideo>,
      ),
    );
    const video = screen.getByTestId("interactive-video-player") as HTMLVideoElement;
    Object.defineProperty(video, "currentTime", { value: 1.5, writable: true });
    fireEvent.timeUpdate(video);
    expect(screen.getByTestId("timed-cue-0")).toBeTruthy();
    expect(screen.getByTestId("cue-continue")).toBeTruthy();
  });

  it("renders timed cue when saved compound index exceeds cue count", () => {
    sessionStorage.setItem(
      "lessonkit:compound:compound-course:iv-clamp",
      JSON.stringify({ activePageIndex: 99, childStates: {} }),
    );
    render(
      wrap(
        <InteractiveVideo blockId="iv-clamp" title="Briefing" src="/sample.mp4">
          <TimedCue atSeconds={0} label="Only cue">
            <Text>Single cue</Text>
          </TimedCue>
        </InteractiveVideo>,
        true,
      ),
    );
    const video = screen.getByTestId("interactive-video-player") as HTMLVideoElement;
    Object.defineProperty(video, "currentTime", { value: 0.5, writable: true });
    fireEvent.timeUpdate(video);
    expect(screen.getByTestId("timed-cue-0")).toBeTruthy();
  });

  it("continues after cue dismisses overlay", () => {
    render(
      wrap(
        <InteractiveVideo blockId="iv-2" title="Briefing" src="/sample.mp4">
          <TimedCue atSeconds={0} label="Check">
            <Text>Pause message</Text>
          </TimedCue>
        </InteractiveVideo>,
      ),
    );
    const video = screen.getByTestId("interactive-video-player") as HTMLVideoElement;
    Object.defineProperty(video, "currentTime", { value: 0.5, writable: true });
    fireEvent.timeUpdate(video);
    expect(screen.getByTestId("cue-continue")).toBeTruthy();
    fireEvent.click(screen.getByTestId("cue-continue"));
    expect(screen.queryByTestId("cue-continue")).toBeNull();
  });

  it("blocks Continue until mustComplete assessment is answered", () => {
    render(
      wrap(
        <InteractiveVideo blockId="iv-mc" title="Briefing" src="/sample.mp4">
          <TimedCue atSeconds={0} label="Check" mustComplete>
            <TrueFalse checkId="iv-mc-tf" question="Ready?" answer={true} />
          </TimedCue>
        </InteractiveVideo>,
      ),
    );
    const video = screen.getByTestId("interactive-video-player") as HTMLVideoElement;
    Object.defineProperty(video, "currentTime", { value: 0.5, writable: true });
    fireEvent.timeUpdate(video);
    const continueBtn = screen.getByTestId("cue-continue") as HTMLButtonElement;
    expect(continueBtn.disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "True" }));
    expect(continueBtn.disabled).toBe(false);
  });

  it("aggregates showVideoScore across all cue assessments", () => {
    render(
      wrap(
        <InteractiveVideo blockId="iv-score" title="Briefing" src="/sample.mp4" showVideoScore>
          <TimedCue atSeconds={0} label="Q1">
            <TrueFalse checkId="iv-s1" question="One?" answer={true} />
          </TimedCue>
          <TimedCue atSeconds={10} label="Q2">
            <TrueFalse checkId="iv-s2" question="Two?" answer={false} />
          </TimedCue>
        </InteractiveVideo>,
      ),
    );
    expect(screen.getByTestId("video-score").textContent).toContain("Score: 0 / 2");
    const video = screen.getByTestId("interactive-video-player") as HTMLVideoElement;
    Object.defineProperty(video, "currentTime", { value: 0.5, writable: true, configurable: true });
    fireEvent.timeUpdate(video);
    fireEvent.click(screen.getByRole("radio", { name: "True" }));
    expect(screen.getByTestId("video-score").textContent).toContain("Score: 1 / 2");
    Object.defineProperty(video, "currentTime", { value: 10.5, writable: true, configurable: true });
    fireEvent.timeUpdate(video);
    expect(screen.getAllByRole("radio", { name: "False" }).length).toBeGreaterThan(0);
  });

  it("restores firedCueIndices from saved meta without re-firing completed cues", async () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "iv-fired",
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: {
          [IV_META_KEY]: {
            currentTime: 2,
            completedCueIndices: [0],
            firedCueIndices: [0],
          },
        },
      }),
    );

    render(
      wrap(
        <InteractiveVideo blockId="iv-fired" title="Briefing" src="/sample.mp4">
          <TimedCue atSeconds={1} label="Check">
            <Text>Pause message</Text>
          </TimedCue>
          <TimedCue atSeconds={5} label="Later">
            <Text>Later cue</Text>
          </TimedCue>
        </InteractiveVideo>,
        true,
      ),
    );

    const video = screen.getByTestId("interactive-video-player") as HTMLVideoElement;
    Object.defineProperty(video, "currentTime", { value: 6, writable: true, configurable: true });
    fireEvent.timeUpdate(video);
    expect(screen.getByTestId("cue-continue")).toBeTruthy();
    expect(screen.getByTestId("timed-cue-1")).toBeTruthy();
    expect((screen.getByTestId("timed-cue-0") as HTMLElement).hidden).toBe(true);
  });
});

describe("BranchingScenario", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("navigates via branch choices", () => {
    render(
      wrap(
        <BranchingScenario blockId="resolution-paths" title="Resolution paths" startNodeId="offer">
          <BranchNode nodeId="offer">
            <Scenario>
              <p>Choose how to close the loop.</p>
            </Scenario>
            <BranchChoice label="Offer credit" targetNodeId="credit" />
            <BranchChoice label="Supervisor" targetNodeId="supervisor" />
          </BranchNode>
          <BranchNode nodeId="credit" terminal>
            <Text>Credit path complete.</Text>
          </BranchNode>
          <BranchNode nodeId="supervisor" terminal>
            <Text>Supervisor path complete.</Text>
          </BranchNode>
        </BranchingScenario>,
      ),
    );
    expect(screen.getByText("Choose how to close the loop.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("branch-choice-credit"));
    expect(screen.getByText("Credit path complete.")).toBeTruthy();
  });

  it("scores only the visited branch assessments", () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <BranchingScenario
          ref={ref}
          blockId="branch-score"
          title="Scored paths"
          startNodeId="offer"
          showPathScore
        >
          <BranchNode nodeId="offer">
            <BranchChoice label="Credit" targetNodeId="credit" />
            <BranchChoice label="Supervisor" targetNodeId="supervisor" />
          </BranchNode>
          <BranchNode nodeId="credit" terminal>
            <TrueFalse checkId="credit-check" question="Document credit?" answer={true} />
          </BranchNode>
          <BranchNode nodeId="supervisor" terminal>
            <TrueFalse checkId="supervisor-check" question="Cold transfer?" answer={false} />
          </BranchNode>
        </BranchingScenario>,
      ),
    );
    fireEvent.click(screen.getByTestId("branch-choice-credit"));
    fireEvent.click(screen.getByRole("radio", { name: "True" }));
    expect(ref.current?.getScore()).toBe(1);
    expect(ref.current?.getMaxScore()).toBe(1);
    expect(screen.getByTestId("branch-score").textContent).toContain("Score: 1 / 1");
  });

  it("includes max choice scoreWeight in branch getMaxScore", () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <BranchingScenario
          ref={ref}
          blockId="branch-choice-max"
          title="Weighted paths"
          startNodeId="offer"
          showPathScore
        >
          <BranchNode nodeId="offer">
            <BranchChoice label="Credit" targetNodeId="credit" scoreWeight={3} />
            <BranchChoice label="Supervisor" targetNodeId="supervisor" scoreWeight={10} />
          </BranchNode>
          <BranchNode nodeId="credit" terminal>
            <TrueFalse checkId="credit-weight-check" question="Document credit?" answer={true} />
          </BranchNode>
          <BranchNode nodeId="supervisor" terminal>
            <Text>Supervisor path</Text>
          </BranchNode>
        </BranchingScenario>,
      ),
    );
    fireEvent.click(screen.getByTestId("branch-choice-credit"));
    fireEvent.click(screen.getByRole("radio", { name: "True" }));
    expect(ref.current?.getScore()).toBe(4);
    expect(ref.current?.getMaxScore()).toBe(11);
    expect(screen.getByTestId("branch-score").textContent).toContain("Score: 4 / 11");
  });

  it("persists graph position in session storage", async () => {
    render(
      wrap(
        <BranchingScenario blockId="branch-resume" title="Resume" startNodeId="offer" showPathRecap>
          <BranchNode nodeId="offer" title="Offer">
            <BranchChoice label="Credit" targetNodeId="credit" />
          </BranchNode>
          <BranchNode nodeId="credit" terminal title="Credit">
            <Text>Done</Text>
          </BranchNode>
        </BranchingScenario>,
        true,
      ),
    );
    fireEvent.click(screen.getByTestId("branch-choice-credit"));
    expect(screen.getByText("Done")).toBeTruthy();
    await waitFor(() => {
      const key = compoundStateStorageKey(COURSE_ID, "branch-resume");
      expect(sessionStorage.getItem(key)).toBeTruthy();
    });
  });

  it("restores legacy branch saves via activePageIndex and child states", async () => {
    saveCompoundState(
      createSessionStoragePort(),
      COURSE_ID,
      "branch-legacy",
      createCompoundResumeState({
        activePageIndex: 1,
        childStates: {
          "credit-check": { selected: true, passed: true, checked: true },
        },
      }),
    );

    render(
      wrap(
        <BranchingScenario blockId="branch-legacy" title="Legacy" startNodeId="offer">
          <BranchNode nodeId="offer">
            <BranchChoice label="Credit" targetNodeId="credit" />
          </BranchNode>
          <BranchNode nodeId="credit" terminal>
            <TrueFalse checkId="credit-check" question="Document credit?" answer={true} />
          </BranchNode>
        </BranchingScenario>,
        true,
      ),
    );

    await waitFor(() => {
      const trueRadio = screen.getByRole("radio", { name: "True" }) as HTMLInputElement;
      expect(trueRadio.checked).toBe(true);
    });
    expect(screen.getByTestId("branching-scenario-active-node").textContent).toContain(
      "Document credit?",
    );
  });

  it("round-trips branch meta via getCurrentState and resume", async () => {
    const ref = createRef<CompoundHandle>();
    render(
      wrap(
        <BranchingScenario ref={ref} blockId="branch-handle" title="Handle" startNodeId="offer">
          <BranchNode nodeId="offer">
            <BranchChoice label="Credit" targetNodeId="credit" />
          </BranchNode>
          <BranchNode nodeId="credit" terminal>
            <Text>Done</Text>
          </BranchNode>
        </BranchingScenario>,
      ),
    );
    fireEvent.click(screen.getByTestId("branch-choice-credit"));
    expect(screen.getByText("Done")).toBeTruthy();
    const saved = ref.current?.getCurrentState();
    expect(saved?.childStates.__lk_bs__).toMatchObject({ activeNodeId: "credit" });

    ref.current?.resume(
      createCompoundResumeState({
        activePageIndex: 0,
        childStates: {
          __lk_bs__: { activeNodeId: "offer", visitedNodeIds: ["offer"] },
        },
      }),
    );
    await waitFor(() => {
      expect(screen.getByTestId("branch-node-offer").hasAttribute("hidden")).toBe(false);
      expect(screen.getByTestId("branch-node-credit").hasAttribute("hidden")).toBe(true);
    });

    ref.current?.resume(saved!);
    await waitFor(() => {
      expect(screen.getByTestId("branch-node-credit").hasAttribute("hidden")).toBe(false);
    });
  });

  it("ignores navigation to unknown targetNodeId", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      wrap(
        <BranchingScenario blockId="branch-invalid" title="Invalid" startNodeId="offer">
          <BranchNode nodeId="offer">
            <BranchChoice label="Bad" targetNodeId="creditt" />
          </BranchNode>
          <BranchNode nodeId="credit" terminal>
            <Text>Done</Text>
          </BranchNode>
        </BranchingScenario>,
      ),
    );
    fireEvent.click(screen.getByTestId("branch-choice-creditt"));
    expect(screen.getByTestId("branch-node-offer").hasAttribute("hidden")).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("ignores navigateToNode when fromNodeId does not match active node", () => {
    function StaleNavigateProbe() {
      const ctx = useBranchingScenarioOptional();
      return (
        <button
          type="button"
          data-testid="stale-navigate"
          onClick={() =>
            ctx?.navigateToNode({
              fromNodeId: "offer",
              toNodeId: "supervisor",
              label: "Stale",
            })
          }
        />
      );
    }

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      wrap(
        <BranchingScenario blockId="branch-stale-nav" title="Stale nav" startNodeId="offer">
          <BranchNode nodeId="offer">
            <BranchChoice label="Credit" targetNodeId="credit" />
            <BranchChoice label="Supervisor" targetNodeId="supervisor" />
          </BranchNode>
          <BranchNode nodeId="credit" terminal>
            <Text>Credit path complete.</Text>
            <StaleNavigateProbe />
          </BranchNode>
          <BranchNode nodeId="supervisor" terminal>
            <Text>Supervisor path complete.</Text>
          </BranchNode>
        </BranchingScenario>,
      ),
    );
    fireEvent.click(screen.getByTestId("branch-choice-credit"));
    expect(screen.getByText("Credit path complete.")).toBeTruthy();
    fireEvent.click(screen.getByTestId("stale-navigate"));
    expect(screen.getByTestId("branch-node-credit").hasAttribute("hidden")).toBe(false);
    expect(screen.getByTestId("branch-node-supervisor").hasAttribute("hidden")).toBe(true);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('navigateToNode from "offer" but active node is "credit"'),
    );
    warn.mockRestore();
  });
});
