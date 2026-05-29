import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import App from "./App";

describe("customer service example", () => {
  afterEach(() => cleanup());

  it("renders contact center course and channel briefing", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByRole } = render(<App />);
    expect(getByRole("heading", { name: "Customer Care: De-escalation" })).toBeDefined();
    expect(getByRole("heading", { name: "Channels & QA" })).toBeDefined();
    spy.mockRestore();
  });

  it("reflective chat reply shows coaching feedback", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText, getByRole } = render(<App />);
    const nav = within(getByRole("navigation", { name: "Course curriculum" }));
    fireEvent.click(nav.getByRole("button", { name: /Live chat/i }));
    fireEvent.click(getByText(/I’m sorry you’ve been passed around/i));
    expect(getByText(/Good—reflect before policy/)).toBeDefined();
    spy.mockRestore();
  });
});
