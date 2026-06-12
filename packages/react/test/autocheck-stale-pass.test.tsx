/**
 * Regression tests for autoCheck + enableRetry stale `passed` state.
 * FillInTheBlanks remains a known bug (#185) via it.fails until fixed.
 */
import React, { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AssessmentHandle } from "@lessonkit/core";
import { Course, DragTheWords, FillInTheBlanks, Lesson } from "../src";

const config = { xapi: { enabled: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="AutoCheck repro" courseId="autocheck-repro" config={config}>
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("autoCheck stale passed state (known bugs)", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it.fails("FillInTheBlanks autoCheck+enableRetry clears passed UI after wrong edit", async () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <FillInTheBlanks
          ref={ref}
          checkId="fib-autocheck"
          autoCheck
          enableRetry
          template="The *capital* is France."
        />,
      ),
    );
    const input = screen.getByTestId("blank-blank-0");
    fireEvent.change(input, { target: { value: "capital" } });
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Correct"));
    fireEvent.change(input, { target: { value: "wrong" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("Try again");
    });
    expect(ref.current?.getScore()).toBe(0);
  });

  it("DragTheWords autoCheck+enableRetry clears passed UI after wrong placement", async () => {
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <DragTheWords
          ref={ref}
          checkId="dtw-autocheck"
          autoCheck
          enableRetry
          template="I like *cats*"
          words={["cats", "dogs"]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("word-cats"));
    fireEvent.click(screen.getByTestId("zone-0"));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Correct"));
    fireEvent.click(screen.getByTestId("word-dogs"));
    fireEvent.click(screen.getByTestId("zone-0"));
    fireEvent.click(screen.getByTestId("check-drag-words"));
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("Try again");
    });
    expect(ref.current?.getScore()).toBe(0);
  });
});
