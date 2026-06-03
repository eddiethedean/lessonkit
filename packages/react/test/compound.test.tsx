import React, { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CompoundHandle } from "@lessonkit/core";
import { compoundStateStorageKey, createCompoundResumeState, saveCompoundState } from "@lessonkit/core";
import { createSessionStoragePort } from "@lessonkit/core";
import {
  AssessmentSequence,
  Course,
  InteractiveBook,
  Lesson,
  Page,
  Quiz,
  Text,
  TrueFalse,
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
    fireEvent.click(screen.getByTestId("sequence-next"));
    expect(screen.getByText("Question 2 of 2")).toBeTruthy();
  });
});
