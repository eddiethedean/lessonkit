import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import App from "./App";

describe("customer service example", () => {
  afterEach(() => cleanup());

  it("renders contact center course and channel briefing", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText, getByRole } = render(<App />);
    expect(getByText("Customer Care: De-escalation")).toBeDefined();
    expect(getByRole("heading", { name: "Live chat" })).toBeDefined();
    spy.mockRestore();
  });

  it("reflective chat reply shows coaching feedback", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText, getByRole } = render(<App />);
    const stepper = within(getByRole("navigation", { name: "Training steps" }));
    fireEvent.click(stepper.getByText("Live chat"));
    fireEvent.click(getByText(/I’m sorry you’ve been passed around/i));
    expect(getByText(/Good—reflect before policy/)).toBeDefined();
    spy.mockRestore();
  });
});
