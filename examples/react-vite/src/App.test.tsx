import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import App from "./App";

describe("example App", () => {
  afterEach(() => cleanup());

  it("renders without crashing", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<App />);
    spy.mockRestore();
    expect(true).toBe(true);
  });

  it(
    "lets you triage inbox, navigate lessons, unlock hints, and complete the course",
    async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.useFakeTimers();

    const { getAllByLabelText, getAllByText, getByText, queryByText } = render(<App />);
    const nav = within(getAllByLabelText("Navigation")[0]!);

    // Lesson 1: triage inbox (3 emails)
    await act(async () => {
      fireEvent.click(getAllByText("Open")[0]!);
      fireEvent.click(getAllByText("Ignore")[1]!);
      fireEvent.click(getAllByText("Report")[2]!);
    });

    expect(getAllByText(/Handled:/)).toHaveLength(3);
    expect(queryByText(/High risk/i)).toBeTruthy();

    // Navigate to lesson 2 (unmounts lesson 1 -> completion)
    fireEvent.click(nav.getByText("Next"));

    // Lesson 2: wait for hint unlocks, then choose a path.
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(getByText(/Hint unlocked/)).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(getByText(/Deeper hint/)).toBeDefined();

    fireEvent.click(getByText("Tell them to verify using the portal"));
    expect(getByText(/Good\./)).toBeDefined();

    // Navigate to lesson 3 (unmounts lesson 2 -> completion)
    fireEvent.click(nav.getByText("Next"));

    // Course completion is gated by completing prior lessons.
    const completeBtn = getByText("Mark course complete") as HTMLButtonElement;
    expect(completeBtn.disabled).toBe(false);
    fireEvent.click(completeBtn);

    vi.useRealTimers();
    spy.mockRestore();
    },
    15000,
  );

  it("covers the risky timed-decision branch", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.useFakeTimers();

    const { getAllByLabelText, getByText } = render(<App />);
    const nav = within(getAllByLabelText("Navigation")[0]!);

    // Jump to lesson 2
    fireEvent.click(nav.getByText("Next"));
    expect(getByText(/Time pressure/)).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(6000);
    });

    fireEvent.click(getByText("Tell them to act immediately"));
    expect(getByText(/Risky\./)).toBeDefined();

    vi.useRealTimers();
    spy.mockRestore();
  });
});

