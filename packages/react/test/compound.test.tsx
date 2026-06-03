import React, { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CompoundHandle } from "@lessonkit/core";
import {
  AssessmentSequence,
  Course,
  InteractiveBook,
  Lesson,
  Page,
  Text,
  TrueFalse,
} from "../src";

const config = { xapi: { enabled: false }, session: { persistCompoundState: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="Compound" courseId="compound-course" config={config}>
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
    fireEvent.click(radios.find((el) => el.closest("[data-lk-check-id='tf-b']") && (el as HTMLInputElement).labels?.[0]?.textContent === "False")!);
    expect(ref.current?.getMaxScore()).toBe(2);
    expect(ref.current?.getScore()).toBe(2);
  });
});
